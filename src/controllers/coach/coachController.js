'use strict'

const CoachService = require('../../services/coach/coach.service')

/**
 * 1. Get Coach Dashboard Statistics
 * GET /api/coach/stats
 */
exports.stats = async (req, res) => {
  try {
    const coachId = req.user?.id
    const result = await CoachService.getCoachStats(coachId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in stats controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 2. Get Coach Students List
 * GET /api/coach/students
 */
exports.students = async (req, res) => {
  try {
    const coachId = req.user?.id
    const result = await CoachService.getCoachStudents(coachId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in students controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 3. Get Coach Earnings Overview
 * GET /api/coach/earnings
 */
exports.earnings = async (req, res) => {
  try {
    const coachId = req.user?.id
    const result = await CoachService.getCoachEarnings(coachId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in earnings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
