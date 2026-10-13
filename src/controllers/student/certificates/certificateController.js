'use strict'

const StudentCertificateService = require('../../../services/student/certificates/studentCertificateService')

/**
 * 1. Get Student Certificates
 * GET /api/student/certificates
 */
exports.certificates = async (req, res) => {
  try {
    const studentId = req.user?.id
    const result = await StudentCertificateService.getStudentCertificates(studentId)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in certificates controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}
