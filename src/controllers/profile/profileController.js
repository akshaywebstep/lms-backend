const UserService = require('../../services/profile/profileService')
const { ok, fail } = require('../../utils/response')
const { toPublicUser } = require('../../utils/userHelper')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.getProfile = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const user = await UserService.findById(req.user.id)
  if (!user) return fail(res, 404, 'User not found')
  return ok(res, { profile: toPublicUser(user), user: toPublicUser(user) }, 'Profile fetched successfully.')
}

exports.updateProfile = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const user = await UserService.updateProfile(req.user.id, req.body)
  if (!user) return fail(res, 404, 'User not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'UPDATE_PROFILE',
    module: 'profile',
    description: `User '${user.name || user.email}' updated profile details`,
    status: 'success',
    metadata: { userId: req.user.id },
  })

  return ok(res, { profile: toPublicUser(user), user: toPublicUser(user) }, 'Profile updated successfully.')
}