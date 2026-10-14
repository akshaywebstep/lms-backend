
const studentCourseService = require('../../../services/student/courses/studentCourseService')

/**
 * 1. Get Student Courses
 * GET /api/student/courses
 * GET /api/student/courses/enrolled
 */
exports.myCourses = async (req, res) => {
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

    const result = await studentCourseService.getStudentCourses(studentId)

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch enrolled courses.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Enrolled courses fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in myCourses controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
