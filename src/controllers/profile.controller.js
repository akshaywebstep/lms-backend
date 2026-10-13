'use strict'

const UserService = require('../services/user.service')
const { ok, fail } = require('../utils/response')
const { toPublicUser } = require('../utils/userHelper')

const getProfile = async (ctx) => {
  const user = await UserService.findById(ctx.user.id)
  if (!user) return fail(ctx.res, 404, 'User not found')
  return ok(ctx.res, { profile: toPublicUser(user), user: toPublicUser(user) })
}

const updateProfile = async (ctx) => {
  const user = await UserService.updateProfile(ctx.user.id, ctx.body)
  if (!user) return fail(ctx.res, 404, 'User not found')
  return ok(ctx.res, { profile: toPublicUser(user), user: toPublicUser(user) })
}

module.exports = {
  getProfile,
  updateProfile,
}