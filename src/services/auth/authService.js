
const {
  User,
  UserProfile,
  Session,
  RevokedToken,
  PasswordOtp,
  ResetToken,
  Notification,
} = require('../../models')
const UserService = require('../profile/profileService')
const { cleanEmail, toPublicUser } = require('../../utils/userHelper')
const { createToken, readToken } = require('../token')
const { hashPassword, verifyPassword } = require('../../utils/password')
const { sendMail } = require('../mail')
const { makeId } = require('../../utils/id')
const { saveUploadedFile } = require('../upload')
const { ROLES } = require('../../config/constants')
const { env, sequelize } = require('../../config/db')

const adminAuthService = require('./adminAuthService')
const coachAuthService = require('./coachAuthService')
const studentAuthService = require('./studentAuthService')

exports.adminAuth = adminAuthService
exports.coachAuth = coachAuthService
exports.studentAuth = studentAuthService

exports.makeSession = async (userInstance) => {
  const user =
    typeof userInstance.toJSON === 'function'
      ? userInstance.toJSON()
      : userInstance
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

exports.login = async ({ email, password, role }) => {
  if (role === 'admin' || role === 'super_admin' || role === 'superadmin') {
    const res = await adminAuthService.loginAdmin({ email, password })
    return res.data
  }
  if (role === 'coach') {
    const res = await coachAuthService.loginCoach({ email, password })
    return res.data
  }
  if (role === 'student') {
    const res = await studentAuthService.loginStudent({ email, password })
    return res.data
  }

  // General login
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' }
  }
  const userInstance = await UserService.findByEmail(email)
  if (!userInstance) {
    throw { status: 401, message: 'Invalid credentials' }
  }
  const user = userInstance.toJSON()
  if (
    !verifyPassword(password, {
      passwordHash: user.password_hash,
      salt: user.salt,
    })
  ) {
    throw { status: 401, message: 'Invalid credentials' }
  }
  if (role && user.role !== role) {
    throw { status: 403, message: `This account is not a ${role}` }
  }
  if (user.status !== 'active') {
    throw { status: 403, message: 'Your account is not active' }
  }
  return exports.makeSession(userInstance)
}

exports.register = async (body) => {
  return studentAuthService.registerStudent(body).then((r) => r.data)
}

exports.refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw { status: 400, message: 'Refresh token is required' }
  }
  let payload
  try {
    payload = readToken(refreshToken)
  } catch (error) {
    throw { status: 401, message: error.message }
  }
  if (payload.type !== 'refresh') {
    throw { status: 401, message: 'Use a refresh token' }
  }

  const revoked = await RevokedToken.findOne({
    where: { token_id: payload.jti },
  })
  if (revoked) {
    throw { status: 401, message: 'Refresh token is invalidated' }
  }

  const userInstance = await UserService.findById(payload.sub)
  if (!userInstance) {
    throw { status: 401, message: 'User not found' }
  }

  const access = createToken(
    userInstance.toJSON(),
    'access',
    env.accessTtlMs
  )
  await Session.create({
    id: makeId('session'),
    user_id: userInstance.id,
    access_token_id: access.tokenId,
    refresh_token_id: payload.jti,
    expires_at: new Date(access.payload.exp * 1000),
  })

  return { accessToken: access.token }
}

exports.logout = async ({ user, tokenPayload, refreshToken }) => {
  if (tokenPayload?.jti) {
    await RevokedToken.create({
      token_id: tokenPayload.jti,
      user_id: user.id,
      expires_at: new Date(tokenPayload.exp * 1000),
    }).catch(() => {})
  }
  if (refreshToken) {
    try {
      const refresh = readToken(refreshToken)
      await RevokedToken.create({
        token_id: refresh.jti,
        user_id: user.id,
        expires_at: new Date(refresh.exp * 1000),
      }).catch(() => {})
    } catch {}
  }
  return { success: true }
}
