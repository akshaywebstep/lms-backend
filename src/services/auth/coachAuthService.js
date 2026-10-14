
const UserService = require('../profile/profileService')
const { verifyPassword, hashPassword } = require('../../utils/password')
const { toPublicUser, cleanEmail } = require('../../utils/userHelper')
const { createToken } = require('../token')
const { makeId } = require('../../utils/id')
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
 * Coach Login
 */
exports.loginCoach = async ({ email, password }) => {
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

  if (user.role !== ROLES.COACH) {
    throw { status: 403, message: 'This account is not a registered Coach' }
  }

  if (user.status !== 'active') {
    throw { status: 403, message: 'Your coach account is suspended or inactive' }
  }

  const session = await makeSession(userInstance)
  await logActivity({
    userId: user.id,
    role: ROLES.COACH,
    action: 'COACH_LOGIN',
    module: 'auth',
    description: `Coach ${user.name} logged into platform`,
    status: 'success',
  })

  return {
    status: true,
    message: 'Coach authenticated successfully.',
    data: session,
  }
}

/**
 * Coach Registration (if allowed via public flow)
 */
exports.registerCoach = async (body) => {
  if (!body.name || !body.email || !body.password) {
    throw { status: 400, message: 'Name, email and password are required' }
  }

  const clean = cleanEmail(body.email)
  const existing = await UserService.findByEmail(clean)
  if (existing) {
    throw { status: 409, message: 'Email is already registered' }
  }

  const hashed = hashPassword(body.password)
  const coachId = makeId(ROLES.COACH)

  await sequelize.transaction(async (t) => {
    await User.create(
      {
        id: coachId,
        name: String(body.name).trim(),
        email: clean,
        role: ROLES.COACH,
        title: body.title || 'Coach',
        status: 'active',
        password_hash: hashed.passwordHash,
        salt: hashed.salt,
      },
      { transaction: t }
    )

    await UserProfile.create(
      {
        user_id: coachId,
        phone: body.phone || null,
        bio: body.bio || null,
        education: body.education || null,
        expertise: body.expertise || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || 'India',
      },
      { transaction: t }
    )
  })

  const saved = await UserService.findById(coachId)

  await Notification.create({
    id: makeId('notif'),
    type: 'account',
    recipient_role: 'admin',
    title: 'New Coach Registered',
    message: `${saved.name} registered as a coach.`,
  }).catch(() => {})

  await sendMail({
    module: 'coach',
    action: 'coach-welcome',
    to: clean,
    vars: {
      name: saved.name,
      appName: env.appName,
      email: clean,
      password: body.password,
    },
  }).catch(() => {})

  const session = await makeSession(saved)
  await logActivity({
    userId: saved.id,
    role: ROLES.COACH,
    action: 'COACH_REGISTER',
    module: 'auth',
    description: `New coach registered: ${saved.name} (${saved.email})`,
    status: 'success',
  })

  return {
    status: true,
    message: 'Coach registered successfully.',
    data: session,
  }
}

/**
 * Get Coach Profile
 */
exports.getCoachProfile = async (coachId) => {
  const user = await UserService.findById(coachId)
  if (!user) {
    throw { status: 404, message: 'Coach not found' }
  }
  return {
    status: true,
    message: 'Coach profile fetched successfully.',
    data: { user: toPublicUser(user) },
  }
}
