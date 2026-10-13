'use strict'

const CoachDashboardService = require('../../../services/coach/dashboard/coachDashboardService')

/**
 * 1. Get Coach Dashboard Statistics
 * GET /api/coach/stats
 */
exports.stats = async (req, res) => {
  try {
    const coachId = req.user?.id
    const result = await CoachDashboardService.getCoachStats(coachId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in stats controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
