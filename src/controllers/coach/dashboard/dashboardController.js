
const coachDashboardService = require('../../../services/coach/dashboard/coachDashboardService')

/**
 * 1. Get Coach Dashboard Statistics
 * GET /api/coach/stats
 */
exports.stats = async (req, res) => {
  try {
    const coachId = req.user?.id
    if (!coachId) {
      return res.status(401).json({
        status: false,
        success: false,
        message: 'Unauthorized: Coach authentication required.',
        data: null,
      })
    }

    const result = await coachDashboardService.getCoachStats(coachId)

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch coach statistics.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Coach statistics fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in stats controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
