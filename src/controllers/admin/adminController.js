'use strict'

const AdminService = require('../../services/admin/admin.service')
const { logActivity } = require('../../utils/admin/activityLogger')
const { createNotification } = require('../../utils/admin/notificationHelper')

const PANEL = 'admin'
const MODULE = 'admin'

const getAdminName = (req) => {
  if (!req.user && !req.admin) return 'Admin'
  const u = req.user || req.admin
  return u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Admin'
}

/**
 * 1. Get Dashboard Stats
 * GET /api/admin/stats
 */
exports.stats = async (req, res) => {
  try {
    const result = await AdminService.getDashboardStats()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in stats controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 2. Get Coaches List
 * GET /api/admin/coaches
 */
exports.coaches = async (req, res) => {
  try {
    const result = await AdminService.getAllCoaches()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in coaches controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 3. Create Coach
 * POST /api/admin/coaches
 */
exports.createCoach = async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.name || !body.email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' })
    }
    const result = await AdminService.createCoach(body)
    if (!result.status) {
      await logActivity(req, PANEL, 'coaches', 'create', result, false).catch(() => {})
      return res.status(400).json(result)
    }

    await logActivity(req, PANEL, 'coaches', 'create', result.data, true).catch(() => {})
    const adminName = getAdminName(req)
    await createNotification(req, 'New Coach Created', `Coach '${body.name}' was created by ${adminName}.`, 'Admins').catch(() => {})

    return res.status(201).json(result.data)
  } catch (error) {
    console.error('❌ Error in createCoach controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 4. Get Coach Detail
 * GET /api/admin/coaches/:id
 */
exports.coachDetail = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminService.getCoachById(id)
    return res.status(result.status ? 200 : 404).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in coachDetail controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 5. Update Coach
 * PUT /api/admin/coaches/:id
 */
exports.updateCoach = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminService.updateCoach(id, req.body)
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 6. Delete Coach
 * DELETE /api/admin/coaches/:id
 */
exports.deleteCoach = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminService.deleteCoach(id)
    return res.status(result.status ? 200 : 404).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 7. Update Coach Status
 * PATCH /api/admin/coaches/:id/status
 */
exports.updateCoachStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const result = await AdminService.updateCoachStatus(id, status)
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in updateCoachStatus controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 8. Get Students List
 * GET /api/admin/students
 */
exports.students = async (req, res) => {
  try {
    const result = await AdminService.getAllStudents()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in students controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 9. Create Student
 * POST /api/admin/students
 */
exports.createStudent = async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.name || !body.email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' })
    }
    const result = await AdminService.createStudent(body)
    return res.status(result.status ? 201 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 10. Get Student Detail
 * GET /api/admin/students/:id
 */
exports.studentDetail = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminService.getStudentById(id)
    return res.status(result.status ? 200 : 404).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in studentDetail controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 11. Update Student
 * PUT /api/admin/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminService.updateStudent(id, req.body)
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 12. Delete Student
 * DELETE /api/admin/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminService.deleteStudent(id)
    return res.status(result.status ? 200 : 404).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 13. Update Student Status
 * PATCH /api/admin/students/:id/status
 */
exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    const result = await AdminService.updateStudentStatus(id, status)
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in updateStudentStatus controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 14. Get Payments List
 * GET /api/admin/payments
 */
exports.payments = async (req, res) => {
  try {
    const result = await AdminService.getAllPayments()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in payments controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 15. Platform Settings
 */
exports.getPlatformSettings = async (req, res) => {
  try {
    const result = await AdminService.getPlatformSettings()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in getPlatformSettings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

exports.updatePlatformSettings = async (req, res) => {
  try {
    const result = await AdminService.updatePlatformSettings(req.body)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in updatePlatformSettings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 16. Reports, Subscriptions, Block/Unblock
 */
exports.reports = async (req, res) => {
  try {
    const result = await AdminService.getReports()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
  }
}

exports.subscriptions = async (req, res) => {
  try {
    const result = await AdminService.getSubscriptions()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
  }
}

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' })
    const result = await AdminService.updateCoachStatus(userId, 'blocked')
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
  }
}

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' })
    const result = await AdminService.updateCoachStatus(userId, 'active')
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
  }
}
