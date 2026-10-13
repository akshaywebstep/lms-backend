'use strict'

const AdminService = require('../../services/admin/admin.service')
const { ok, created, fail } = require('../../utils/response')

const stats = async (ctx) => {
  const data = await AdminService.getStats()
  return ok(ctx.res, data)
}

const coaches = async (ctx) => {
  const data = await AdminService.listCoaches()
  return ok(ctx.res, { coaches: data })
}

const createCoach = async (ctx) => {
  const body = ctx.body || {}
  if (!body.name || !body.email) return fail(ctx.res, 400, 'Name and email are required')
  const coach = await AdminService.createCoach(body)
  return created(ctx.res, { coach })
}

const coachDetail = async (ctx) => {
  const data = await AdminService.getCoachDetail(ctx.params.id)
  if (!data) return fail(ctx.res, 404, 'Coach not found')
  return ok(ctx.res, data)
}

const updateCoachStatus = async (ctx) => {
  const status = ctx.body.status
  if (!['active', 'blocked'].includes(status)) return fail(ctx.res, 400, 'Invalid status')
  const data = await AdminService.updateCoachStatus(ctx.params.id, status)
  return ok(ctx.res, data)
}

const students = async (ctx) => {
  const data = await AdminService.listStudents()
  return ok(ctx.res, { students: data })
}

const studentDetail = async (ctx) => {
  const data = await AdminService.getStudentDetail(ctx.params.id)
  if (!data) return fail(ctx.res, 404, 'Student not found')
  return ok(ctx.res, data)
}

const updateStudentStatus = async (ctx) => {
  const status = ctx.body.status
  if (!['active', 'blocked'].includes(status)) return fail(ctx.res, 400, 'Invalid status')
  const data = await AdminService.updateStudentStatus(ctx.params.id, status)
  return ok(ctx.res, data)
}

const payments = async (ctx) => {
  const data = await AdminService.listPayments()
  return ok(ctx.res, { payments: data })
}

const reports = async (ctx) => {
  const data = await AdminService.getReports()
  return ok(ctx.res, data)
}

const getPlatformSettings = async (ctx) => {
  const data = await AdminService.getPlatformSettings()
  return ok(ctx.res, data)
}

const updatePlatformSettings = async (ctx) => {
  const data = await AdminService.updatePlatformSettings(ctx.body)
  return ok(ctx.res, data)
}

module.exports = {
  stats,
  coaches,
  createCoach,
  coachDetail,
  updateCoachStatus,
  students,
  studentDetail,
  updateStudentStatus,
  payments,
  reports,
  getPlatformSettings,
  updatePlatformSettings,
}
