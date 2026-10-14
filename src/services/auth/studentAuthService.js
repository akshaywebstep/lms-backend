
const UserService = require('../profile/profileService')
const { verifyPassword, hashPassword } = require('../../utils/password')
const { toPublicUser, cleanEmail } = require('../../utils/userHelper')
const { createToken } = require('../token')
const { makeId } = require('../../utils/id')
const { saveUploadedFile } = require('../upload')
const { Session, User, UserProfile, Notification } = require('../../models')
const { env, sequelize } = require('../../config/db')
const { sendMail } = require('../mail')
const { ROLES } = require('../../config/constants')
const { logActivity } = require('../activity/activityLogService')

const makeSession = async (userInstance) => {
  const user = typeof userInstance.toJSON === 'function' ? userInstance.toJSON() : userInstance
  const access = createToken(user, 'access', env.accessTtlMs)
  const refresh = createToken(user, 'refresh', env.refreshTtlMs)

  await Session.create({
    id: makeId('session'),
    user_id: user.id,
    access_token_id: access.tokenId,
    refresh_token_id: refresh.tokenId,
    expires_at: new Date(refresh.payload.exp * 1000),
  })

  return {
    user: toPublicUser(user),
    accessToken: access.token,
    refreshToken: refresh.token,
  }
}

/**
 * Student Login
 */
exports.loginStudent = async ({ email, password }) => {
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' }
  }

  const userInstance = await UserService.findByEmail(email)
  if (!userInstance) {
    throw { status: 401, message: 'Invalid credentials' }
  }

  const user = userInstance.toJSON()
  const isValid = verifyPassword(password, {
    passwordHash: user.password_hash,
    salt: user.salt,
  })

  if (!isValid) {
    throw { status: 401, message: 'Invalid credentials' }
  }

  if (user.role !== ROLES.STUDENT) {
    throw { status: 403, message: 'This account is not a registered Student' }
  }

  if (user.status !== 'active') {
    throw { status: 403, message: 'Your student account is suspended or inactive' }
  }

  const session = await makeSession(userInstance)
  await logActivity({
    userId: user.id,
    role: ROLES.STUDENT,
    action: 'STUDENT_LOGIN',
    module: 'auth',
    description: `Student ${user.name} logged into platform`,
    status: 'success',
  })

  return {
    status: true,
    message: 'Student authenticated successfully.',
    data: session,
  }
}

/**
 * Student Registration
 */
exports.registerStudent = async (body) => {
  if (!body.name || !body.email || !body.password) {
    throw { status: 400, message: 'Name, email and password are required' }
  }

  const clean = cleanEmail(body.email)
  const existing = await UserService.findByEmail(clean)
  if (existing) {
    throw { status: 409, message: 'Email is already registered' }
  }

  const faceImage = body.files?.find(
    (file) => file.fieldName === 'faceImage' || file.fieldName === 'avatar'
  )
  if (!faceImage) {
    throw { status: 400, message: 'Student face image is required' }
  }
  if (!String(faceImage.mimeType || '').startsWith('image/')) {
    throw { status: 400, message: 'Student face image must be an image file' }
  }

  const uploaded = saveUploadedFile(faceImage)
  const role = ROLES.STUDENT
  const hashed = hashPassword(body.password)
  const userId = makeId(role)

  await sequelize.transaction(async (t) => {
    await User.create(
      {
        id: userId,
        name: String(body.name).trim(),
        email: clean,
        role,
        title: 'Learner',
        avatar_url: `${env.publicUrl}${uploaded.url}`,
        password_hash: hashed.passwordHash,
        salt: hashed.salt,
        status: 'active',
      },
      { transaction: t }
    )

    await UserProfile.create(
      {
        user_id: userId,
        phone: body.phone || body.profile?.phone || null,
        city: body.city || body.profile?.city || null,
        education: body.education || body.profile?.education || null,
        state: body.state || body.profile?.state || null,
        country: body.country || body.profile?.country || 'India',
      },
      { transaction: t }
    )
  })

  const saved = await UserService.findById(userId)

  await Notification.create({
    id: makeId('notif'),
    type: 'account',
    recipient_role: 'admin',
    title: 'New Student Registered',
    message: `${saved.name} registered as a student.`,
  }).catch(() => {})

  await sendMail({
    module: 'student',
    action: 'student-registered',
    to: saved.email,
    vars: { name: saved.name, appName: env.appName },
  }).catch(() => {})

  const session = await makeSession(saved)
  await logActivity({
    userId: saved.id,
    role: ROLES.STUDENT,
    action: 'STUDENT_REGISTER',
    module: 'auth',
    description: `New student registered: ${saved.name} (${saved.email})`,
    status: 'success',
  })

  return {
    status: true,
    message: 'Student registered successfully.',
    data: session,
  }
}

/**
 * Get Student Profile
 */
exports.getStudentProfile = async (studentId) => {
  const user = await UserService.findById(studentId)
  if (!user) {
    throw { status: 404, message: 'Student not found' }
  }
  return {
    status: true,
    message: 'Student profile fetched successfully.',
    data: { user: toPublicUser(user) },
  }
}
