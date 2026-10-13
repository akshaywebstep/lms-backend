'use strict'

const CoachService = require('../../services/coach/coach.service')
const { ok } = require('../../utils/response')

const stats = async (ctx) => {
  const data = await CoachService.getStats(ctx.user.id)
  return ok(ctx.res, data)
}

const students = async (ctx) => {
  const data = await CoachService.listStudents(ctx.user.id)
  return ok(ctx.res, { students: data })
}

const earnings = async (ctx) => {
  const data = await CoachService.getEarnings(ctx.user.id)
  return ok(ctx.res, data)
}

module.exports = { stats, students, earnings }
