const { env } = require('../config/db')
const { readToken } = require('../services/token')
const { fail } = require('../utils/response')
const UserService = require('../services/profile/profileService')
const { RevokedToken } = require('../models')

/**
 * Standard Express Auth Middleware (req, res, next)
 */
const auth = (roles = []) => async (req, res, next) => {
  const header = req.headers?.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return fail(res, 401, 'Missing bearer token')

  let payload
  try {
    payload = readToken(token)
  } catch (error) {
    return fail(res, 401, error.message)
  }

  if (payload.type !== 'access') return fail(res, 401, 'Use an access token')

  // Check if token is revoked via RevokedToken table
  const revoked = await RevokedToken.findOne({ where: { token_id: payload.jti } })
  if (revoked) return fail(res, 401, 'Token has been invalidated')

  const userInstance = await UserService.findById(payload.sub)
  if (!userInstance) return fail(res, 401, 'User not found')

  const user = userInstance.toJSON()
  if (user.status !== 'active') return fail(res, 401, 'User is not active')
  if (roles.length && !roles.includes(user.role)) return fail(res, 403, 'You are not allowed to access this resource')

  req.user = user
  req.tokenPayload = payload
  req.env = env

  return next()
}

module.exports = { auth }