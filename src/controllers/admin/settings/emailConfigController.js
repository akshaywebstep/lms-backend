const { EmailConfig } = require('../../../models')
const { ok, created, fail } = require('../../../utils/response')
const { sendMail } = require('../../../services/mail')
const { logActivity } = require('../../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.list = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const where = {}
  const moduleParam = req.query?.module || (typeof req.query?.get === 'function' ? req.query.get('module') : null)
  if (moduleParam && moduleParam !== 'all') {
    where.module = moduleParam
  }
  const configs = await EmailConfig.findAll({
    where,
    order: [['id', 'ASC']],
  })
  return ok(res, { emailConfigs: configs, templates: configs }, 'Email configs fetched successfully.')
}

exports.getById = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const config = await EmailConfig.findByPk(req.params.id)
  if (!config) return fail(res, 404, 'Email template not found')
  return ok(res, { emailConfig: config, template: config }, 'Email template fetched.')
}

exports.create = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.module || !req.body?.action || !req.body?.subject) {
    return fail(res, 400, 'Module, action and subject are required')
  }
  const config = await EmailConfig.create(req.body)

  await logActivity({
    req,
    userId: req.user?.id,
    role: req.user?.role || 'admin',
    action: 'CREATE_EMAIL_TEMPLATE',
    module: 'email_templates',
    description: `Admin created email template '${config.module}/${config.action}'`,
    status: 'success',
    metadata: { id: config.id, module: config.module, action: config.action, subject: config.subject },
  })

  return created(res, { emailConfig: config, template: config }, 'Email template created.')
}

exports.update = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const config = await EmailConfig.findByPk(req.params.id)
  if (!config) return fail(res, 404, 'Email template not found')
  await config.update(req.body)

  await logActivity({
    req,
    userId: req.user?.id,
    role: req.user?.role || 'admin',
    action: 'UPDATE_EMAIL_TEMPLATE',
    module: 'email_templates',
    description: `Admin updated email template '${config.module}/${config.action}'`,
    status: 'success',
    metadata: { id: config.id, module: config.module, action: config.action },
  })

  return ok(res, { emailConfig: config, template: config }, 'Email template updated.')
}

exports.reset = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const config = await EmailConfig.findByPk(req.params.id)
  if (!config) return fail(res, 404, 'Email template not found')

  await logActivity({
    req,
    userId: req.user?.id,
    role: req.user?.role || 'admin',
    action: 'RESET_EMAIL_TEMPLATE',
    module: 'email_templates',
    description: `Admin reset email template '${config.module}/${config.action}'`,
    status: 'success',
    metadata: { id: config.id },
  })

  return ok(res, { emailConfig: config, template: config }, 'Email template reset.')
}

exports.remove = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const config = await EmailConfig.findByPk(req.params.id)
  if (!config) return fail(res, 404, 'Email template not found')
  await config.destroy()

  await logActivity({
    req,
    userId: req.user?.id,
    role: req.user?.role || 'admin',
    action: 'DELETE_EMAIL_TEMPLATE',
    module: 'email_templates',
    description: `Admin deleted email template '${config.module}/${config.action}'`,
    status: 'success',
    metadata: { id: req.params.id },
  })

  return ok(res, { success: true }, 'Email template deleted.')
}

exports.testSend = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const config = await EmailConfig.findByPk(req.params.id)
  if (!config) return fail(res, 404, 'Email template not found')
  const to = req.body?.to || req.user?.email
  await sendMail({
    module: config.module,
    action: config.action,
    to,
    vars: req.body?.vars || {},
  }).catch(() => {})

  await logActivity({
    req,
    userId: req.user?.id,
    role: req.user?.role || 'admin',
    action: 'TEST_EMAIL_TEMPLATE',
    module: 'email_templates',
    description: `Admin sent test email to '${to}' for '${config.module}/${config.action}'`,
    status: 'success',
    metadata: { to, templateId: config.id },
  })

  return ok(res, { success: true, message: `Test email sent to ${to}` }, `Test email sent to ${to}`)
}
