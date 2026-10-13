'use strict'

const env = require('../config/db').env
const { readToken } = require('../services/token')
const { fail } = require('../utils/response')
const userModel = require('../models/user.model')
const sessionModel = require('../models/session.model')

/**
 * Universal Auth Middleware supporting both Express (req, res, next) and Context (ctx, next)
 */
const auth = (roles = []) => async (reqOrCtx, resOrNext, nextFn) => {
  const isExpress = Boolean(nextFn)
  const req = isExpress ? reqOrCtx : reqOrCtx.req
  const res = isExpress ? resOrNext : reqOrCtx.res
  const next = isExpress ? nextFn : resOrNext

  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return fail(res, 401, 'Missing bearer token')

  let payload
  try {
    payload = readToken(token)
  } catch (error) {
    return fail(res, 401, error.message)
  }

  if (payload.type !== 'access') return fail(res, 401, 'Use an access token')
  if (await sessionModel.isRevoked(payload.jti)) return fail(res, 401, 'Token has been invalidated')

  const user = await userModel.findById(payload.sub)
  if (!user || user.status !== 'active') return fail(res, 401, 'User is not active')
  if (roles.length && !roles.includes(user.role)) return fail(res, 403, 'You are not allowed to access this resource')

  if (isExpress) {
    req.user = user
    req.tokenPayload = payload
    req.env = env
  } else {
    reqOrCtx.user = user
    reqOrCtx.tokenPayload = payload
    reqOrCtx.env = env
  }

  return next()
}

module.exports = { auth }