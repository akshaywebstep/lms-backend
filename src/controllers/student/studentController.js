'use strict'

const StudentService = require('../../services/student/student.service')

/**
 * 1. Get Student Dashboard
 * GET /api/student/dashboard
 */
exports.dashboard = async (req, res) => {
  try {
    const studentId = req.user?.id
    const result = await StudentService.getStudentDashboard(studentId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in dashboard controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 2. Get Student Courses
 * GET /api/student/courses
 */
exports.myCourses = async (req, res) => {
  try {
    const studentId = req.user?.id
    const result = await StudentService.getStudentCourses(studentId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in myCourses controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 3. Get Student Certificates
 * GET /api/student/certificates
 */
exports.certificates = async (req, res) => {
  try {
    const studentId = req.user?.id
    const result = await StudentService.getStudentCertificates(studentId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in certificates controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
