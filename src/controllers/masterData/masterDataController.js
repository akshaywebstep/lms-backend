const MasterDataService = require('../../services/masterData/masterData.service')
const { ok, created, fail } = require('../../utils/response')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.listPublic = async (rawReq, rawRes) => {
  const { res } = getReqRes(rawReq, rawRes)
  const data = await MasterDataService.listPublic()
  return ok(res, data, 'Master data fetched.')
}

exports.listAdminAll = async (rawReq, rawRes) => {
  const { res } = getReqRes(rawReq, rawRes)
  const data = await MasterDataService.listAdminAll()
  return ok(res, data, 'All master data fetched.')
}

exports.listAdmin = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const items = await MasterDataService.listAdmin(req.params.type)
  return ok(res, { items }, `${req.params.type} list fetched.`)
}

exports.createAdmin = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.name) return fail(res, 400, 'Name is required')
  const item = await MasterDataService.create(req.params.type, req.body, 'superadmin', req.user.id)

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: `CREATE_${String(req.params.type).toUpperCase()}`,
    module: 'master_data',
    description: `Admin created master data item '${item.name || req.body.name}' under ${req.params.type}`,
    status: 'success',
    metadata: { type: req.params.type, id: item.id, name: item.name },
  })

  return created(res, { item }, `${req.params.type} created successfully.`)
}

exports.updateAdmin = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const item = await MasterDataService.update(req.params.type, req.params.id, req.body)
  if (!item) return fail(res, 404, 'Item not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: `UPDATE_${String(req.params.type).toUpperCase()}`,
    module: 'master_data',
    description: `Admin updated master data item '${item.name || req.params.id}' under ${req.params.type}`,
    status: 'success',
    metadata: { type: req.params.type, id: req.params.id },
  })

  return ok(res, { item }, `${req.params.type} updated successfully.`)
}

exports.deleteAdmin = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const deleted = await MasterDataService.delete(req.params.type, req.params.id)
  if (!deleted) return fail(res, 404, 'Item not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: `DELETE_${String(req.params.type).toUpperCase()}`,
    module: 'master_data',
    description: `Admin deleted master data item ID ${req.params.id} from ${req.params.type}`,
    status: 'success',
    metadata: { type: req.params.type, id: req.params.id },
  })

  return ok(res, { success: true }, `${req.params.type} deleted successfully.`)
}

exports.createCoachCategory = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.name) return fail(res, 400, 'Category name is required')
  const item = await MasterDataService.create('category', req.body, 'coach', req.user.id)

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_CATEGORY',
    module: 'master_data',
    description: `Coach requested/created category '${item.name || req.body.name}'`,
    status: 'success',
    metadata: { id: item.id, name: item.name },
  })

  return created(res, { item }, 'Category created successfully.')
}