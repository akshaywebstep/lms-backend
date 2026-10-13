'use strict'

const MasterDataService = require('../../services/masterData/masterData.service')
const { ok, created, fail } = require('../../utils/response')

const listPublic = async (ctx) => ok(ctx.res, await MasterDataService.listPublic())
const listAdminAll = async (ctx) => ok(ctx.res, await MasterDataService.listAdminAll())

const listAdmin = async (ctx) => {
  const items = await MasterDataService.listAdmin(ctx.params.type)
  return ok(ctx.res, { items })
}

const createAdmin = async (ctx) => {
  if (!ctx.body.name) return fail(ctx.res, 400, 'Name is required')
  const item = await MasterDataService.create(ctx.params.type, ctx.body, 'superadmin', ctx.user.id)
  return created(ctx.res, { item })
}

const updateAdmin = async (ctx) => {
  const item = await MasterDataService.update(ctx.params.type, ctx.params.id, ctx.body)
  if (!item) return fail(ctx.res, 404, 'Item not found')
  return ok(ctx.res, { item })
}

const deleteAdmin = async (ctx) => {
  const deleted = await MasterDataService.delete(ctx.params.type, ctx.params.id)
  if (!deleted) return fail(ctx.res, 404, 'Item not found')
  return ok(ctx.res, { success: true })
}

const createCoachCategory = async (ctx) => {
  if (!ctx.body.name) return fail(ctx.res, 400, 'Category name is required')
  const item = await MasterDataService.create('category', ctx.body, 'coach', ctx.user.id)
  return created(ctx.res, { item })
}

module.exports = {
  listPublic,
  listAdminAll,
  listAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  createCoachCategory,
}