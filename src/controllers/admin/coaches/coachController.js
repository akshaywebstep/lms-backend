
const AdminCoachService = require('../../../services/admin/coaches/adminCoachService')
const { logActivity } = require('../../../utils/admin/activityLogger')
const { createNotification } = require('../../../utils/admin/notificationHelper')

const PANEL = 'admin'
const MODULE = 'coaches'

const getAdminName = (req) => {
  if (!req.user && !req.admin) return 'Admin'
  const u = req.user || req.admin
  return u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Admin'
}

/**
 * 1. Get Coaches List
 * GET /api/admin/coaches
 */
exports.coaches = async (req, res) => {
  try {
    const result = await AdminCoachService.getAllCoaches()
    try {
      await logActivity(req, PANEL, MODULE, 'view_coaches', { count: result.data?.coaches?.length || 0 }, result.status)
    } catch (e) {}
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    console.error('❌ Error in coaches controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 2. Create Coach
 * POST /api/admin/coaches
 */
exports.createCoach = async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.name || !body.email) {
      return res.status(400).json({ status: false, success: false, message: 'Name and email are required', data: null })
    }
    const result = await AdminCoachService.createCoach(body)
    if (!result.status) {
      try {
        await logActivity(req, PANEL, MODULE, 'create', result, false)
      } catch (e) {}
      return res.status(400).json(result)
    }

    try {
      await logActivity(req, PANEL, MODULE, 'create', result.data, true)
    } catch (e) {}

    try {
      const adminName = getAdminName(req)
      await createNotification(
        req,
        'New Coach Created',
        `Coach '${body.name}' was created by ${adminName}.`,
        'Admins'
      )
    } catch (e) {}

    return res.status(201).json(result)
  } catch (error) {
    console.error('❌ Error in createCoach controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 3. Get Coach Detail
 * GET /api/admin/coaches/:id
 */
exports.coachDetail = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminCoachService.getCoachById(id)
    return res.status(result.status ? 200 : 404).json(result)
  } catch (error) {
    console.error('❌ Error in coachDetail controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 4. Update Coach
 * PUT /api/admin/coaches/:id
 */
exports.updateCoach = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminCoachService.updateCoach(id, req.body)
    if (!result.status) {
      try {
        await logActivity(req, PANEL, MODULE, 'update', result, false)
      } catch (e) {}
      return res.status(400).json(result)
    }
    try {
      await logActivity(req, PANEL, MODULE, 'update', result.data, true)
    } catch (e) {}
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 5. Delete Coach
 * DELETE /api/admin/coaches/:id
 */
exports.deleteCoach = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminCoachService.deleteCoach(id)
    if (!result.status) {
      try {
        await logActivity(req, PANEL, MODULE, 'delete', result, false)
      } catch (e) {}
      return res.status(404).json(result)
    }
    try {
      await logActivity(req, PANEL, MODULE, 'delete', { id }, true)
    } catch (e) {}
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 6. Update Coach Status
 * PATCH /api/admin/coaches/:id/status
 */
exports.updateCoachStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ status: false, success: false, message: 'Invalid status', data: null })
    }
    const result = await AdminCoachService.updateCoachStatus(id, status)
    try {
      await logActivity(req, PANEL, MODULE, 'status_update', { id, status }, result.status)
    } catch (e) {}
    return res.status(result.status ? 200 : 400).json(result)
  } catch (error) {
    console.error('❌ Error in updateCoachStatus controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}
