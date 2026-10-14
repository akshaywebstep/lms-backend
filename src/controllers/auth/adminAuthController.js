const adminAuthService = require('../../services/auth/adminAuthService')
const { ok, fail } = require('../../utils/response')
const { toPublicUser } = require('../../utils/userHelper')

exports.login = async (req, res) => {
  if (!res && req?.res) { res = req.res; req = req.req || req }
  try {
    const body = req.body || {}
    const result = await adminAuthService.loginAdmin(body)
    return ok(res, result.data, result.message)
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Admin login failed', err.details || null)
  }
}

exports.me = async (req, res) => {
  if (!res && req?.res) { res = req.res; req = req.req || req }
  try {
    const user = req.user
    return ok(res, { user: toPublicUser(user) }, 'Admin profile retrieved')
  } catch (err) {
    return fail(res, 500, err.message || 'Failed to retrieve admin profile')
  }
}
