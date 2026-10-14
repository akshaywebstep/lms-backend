
const coachStudentService = require('../../../services/coach/students/coachStudentService')

/**
 * 1. Get Coach Students List
 * GET /api/coach/students
 */
exports.students = async (req, res) => {
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

    const result = await coachStudentService.getCoachStudents(coachId)

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch coach students.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Coach students fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in students controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}

/**
 * 2. Get Student Progress Report for Coach
 * GET /api/coach/students/:studentId/progress
 */
exports.studentProgress = async (req, res) => {
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

    const studentId = req.params.studentId || req.params.id
    const courseId = req.query.courseId
    const result = await coachStudentService.getStudentProgress(coachId, studentId, courseId)

    if (!result.status) {
      return res.status(404).json({
        status: false,
        success: false,
        message: result.message || 'Student progress not found.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Student progress loaded successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in studentProgress controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
