
const studentDashboardService = require('../../../services/student/dashboard/studentDashboardService')

/**
 * 1. Get Student Dashboard
 * GET /api/student/dashboard
 * GET /api/student/stats
 */
exports.dashboard = async (req, res) => {
  try {
    const studentId = req.user?.id
    if (!studentId) {
      return res.status(401).json({
        status: false,
        success: false,
        message: 'Unauthorized: Student authentication required.',
        data: null,
      })
    }

    const result = await studentDashboardService.getStudentDashboard(studentId)

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch student dashboard.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Student dashboard fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in dashboard controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
