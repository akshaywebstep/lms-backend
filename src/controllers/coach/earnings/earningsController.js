
const coachEarningsService = require('../../../services/coach/earnings/coachEarningsService')

/**
 * 1. Get Coach Earnings Overview
 * GET /api/coach/earnings
 */
exports.earnings = async (req, res) => {
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

    const result = await coachEarningsService.getCoachEarnings(coachId)

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch coach earnings.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Coach earnings fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in earnings controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
