'use strict'

const { EmailConfig } = require('../models')
const { ok, created, fail } = require('../utils/response')
const { sendMail } = require('../services/mail')

const list = async (ctx) => {
  const configs = await EmailConfig.findAll({ order: [['id', 'ASC']] })
  return ok(ctx.res, { emailConfigs: configs, templates: configs })
}

const getById = async (ctx) => {
  const config = await EmailConfig.findByPk(ctx.params.id)
  if (!config) return fail(ctx.res, 404, 'Email template not found')
  return ok(ctx.res, { emailConfig: config, template: config })
}

const create = async (ctx) => {
  if (!ctx.body.module || !ctx.body.action || !ctx.body.subject) {
    return fail(ctx.res, 400, 'Module, action and subject are required')
  }
  const config = await EmailConfig.create(ctx.body)
  return created(ctx.res, { emailConfig: config, template: config })
}

const update = async (ctx) => {
  const config = await EmailConfig.findByPk(ctx.params.id)
  if (!config) return fail(ctx.res, 404, 'Email template not found')
  await config.update(ctx.body)
  return ok(ctx.res, { emailConfig: config, template: config })
}

const reset = async (ctx) => {
  const config = await EmailConfig.findByPk(ctx.params.id)
  if (!config) return fail(ctx.res, 404, 'Email template not found')
  return ok(ctx.res, { emailConfig: config, template: config })
}

const remove = async (ctx) => {
  const config = await EmailConfig.findByPk(ctx.params.id)
  if (!config) return fail(ctx.res, 404, 'Email template not found')
  await config.destroy()
  return ok(ctx.res, { success: true })
}

const testSend = async (ctx) => {
  const config = await EmailConfig.findByPk(ctx.params.id)
  if (!config) return fail(ctx.res, 404, 'Email template not found')
  const to = ctx.body.to || ctx.user.email
  await sendMail({
    module: config.module,
    action: config.action,
    to,
    vars: ctx.body.vars || {},
  }).catch(() => {})
  return ok(ctx.res, { success: true, message: `Test email sent to ${to}` })
}

module.exports = {
  list,
  getById,
  create,
  update,
  reset,
  remove,
  testSend,
}
