
const AdminDashboardService = require('../../../services/admin/dashboard/adminDashboardService')
const { logActivity } = require('../../../utils/admin/activityLogger')

const PANEL = 'admin'
const MODULE = 'dashboard'

/**
 * 1. Get Dashboard Stats
 * GET /api/admin/stats
 */
exports.stats = async (req, res) => {
  try {
    const result = await AdminDashboardService.getDashboardStats()
    try {
      await logActivity(req, PANEL, MODULE, 'view_stats', result.data?.stats, result.status)
    } catch (e) {}
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    console.error('❌ Error in stats controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 2. Get Reports
 * GET /api/admin/reports
 */
exports.reports = async (req, res) => {
  try {
    const result = await AdminDashboardService.getReports()
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message, data: null })
  }
}
