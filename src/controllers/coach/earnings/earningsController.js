'use strict'

const CoachEarningsService = require('../../../services/coach/earnings/coachEarningsService')

/**
 * 1. Get Coach Earnings Overview
 * GET /api/coach/earnings
 */
exports.earnings = async (req, res) => {
  try {
    const coachId = req.user?.id
    const result = await CoachEarningsService.getCoachEarnings(coachId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in earnings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
