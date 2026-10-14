
const UserService = require('../profile/profileService')
const { verifyPassword } = require('../../utils/password')
const { toPublicUser } = require('../../utils/userHelper')
const { createToken } = require('../token')
const { makeId } = require('../../utils/id')
const { Session } = require('../../models')
const { env } = require('../../config/db')
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
 * Admin / Super Admin Login
 */
exports.loginAdmin = async ({ email, password }) => {
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' }
  }

  const userInstance = await UserService.findByEmail(email)
  if (!userInstance) {
    throw { status: 401, message: 'Invalid admin credentials' }
  }

  const user = userInstance.toJSON()
  const isValid = verifyPassword(password, {
    passwordHash: user.password_hash,
    salt: user.salt,
  })

  if (!isValid) {
    throw { status: 401, message: 'Invalid admin credentials' }
  }

  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'superadmin') {
    throw { status: 403, message: 'Access denied: Admin privileges required' }
  }

  if (user.status !== 'active') {
    throw { status: 403, message: 'This admin account is suspended or inactive' }
  }

  const session = await makeSession(userInstance)
  await logActivity({
    userId: user.id,
    role: user.role,
    action: 'ADMIN_LOGIN',
    module: 'auth',
    description: `Admin ${user.name} logged into system`,
    status: 'success',
  })

  return {
    status: true,
    message: 'Admin authenticated successfully.',
    data: session,
  }
}

/**
 * Get Admin Profile
 */
exports.getAdminProfile = async (adminId) => {
  const user = await UserService.findById(adminId)
  if (!user) {
    throw { status: 404, message: 'Admin not found' }
  }
  return {
    status: true,
    message: 'Admin profile fetched successfully.',
    data: { user: toPublicUser(user) },
  }
}
