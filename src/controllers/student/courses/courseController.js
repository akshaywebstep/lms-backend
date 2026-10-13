'use strict'

const StudentCourseService = require('../../../services/student/courses/studentCourseService')

/**
 * 1. Get Student Courses
 * GET /api/student/courses
 * GET /api/student/courses/enrolled
 */
exports.myCourses = async (req, res) => {
  try {
    const studentId = req.user?.id
    const result = await StudentCourseService.getStudentCourses(studentId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in myCourses controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
