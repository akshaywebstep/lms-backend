'use strict'

const CoachStudentService = require('../../../services/coach/students/coachStudentService')

/**
 * 1. Get Coach Students List
 * GET /api/coach/students
 */
exports.students = async (req, res) => {
  try {
    const coachId = req.user?.id
    const result = await CoachStudentService.getCoachStudents(coachId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in students controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
