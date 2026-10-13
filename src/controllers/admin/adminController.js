'use strict'

const AdminService = require('../../services/admin/admin.service')

const PANEL = 'admin'

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
    return res.status(result.status ? 201 : 400).json(result.status ? result.data : result)
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
 * 5. Update Coach Status
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
 * 6. Get Students List
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
 * 7. Get Student Detail
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
 * 8. Update Student Status
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
 * 9. Get Payments List
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
 * 10. Platform Settings
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
