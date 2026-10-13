'use strict'

const StudentDashboardService = require('../../../services/student/dashboard/studentDashboardService')

/**
 * 1. Get Student Dashboard
 * GET /api/student/dashboard
 * GET /api/student/stats
 */
exports.dashboard = async (req, res) => {
  try {
    const studentId = req.user?.id
    const result = await StudentDashboardService.getStudentDashboard(studentId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in dashboard controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
