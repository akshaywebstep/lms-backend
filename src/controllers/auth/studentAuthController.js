const studentAuthService = require('../../services/auth/studentAuthService')
const { ok, created, fail } = require('../../utils/response')
const { toPublicUser } = require('../../utils/userHelper')

exports.login = async (req, res) => {
  if (!res && req?.res) { res = req.res; req = req.req || req }
  try {
    const body = req.body || {}
    const result = await studentAuthService.loginStudent(body)
    return ok(res, result.data, result.message)
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Student login failed', err.details || null)
  }
}

exports.register = async (req, res) => {
  if (!res && req?.res) { res = req.res; req = req.req || req }
  try {
    const body = req.body || {}
    const result = await studentAuthService.registerStudent(body)
    return created(res, result.data, result.message)
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Student registration failed', err.details || null)
  }
}

exports.me = async (req, res) => {
  if (!res && req?.res) { res = req.res; req = req.req || req }
  try {
    const user = req.user
    return ok(res, { user: toPublicUser(user) }, 'Student profile retrieved')
  } catch (err) {
    return fail(res, 500, err.message || 'Failed to retrieve student profile')
  }
}
