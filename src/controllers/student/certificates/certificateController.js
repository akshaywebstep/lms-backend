
const studentCertificateService = require('../../../services/student/certificates/studentCertificateService')

/**
 * 1. Get Student Certificates
 * GET /api/student/certificates
 */
exports.certificates = async (req, res) => {
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

    const result = await studentCertificateService.getStudentCertificates(studentId)

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch student certificates.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Student certificates fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in certificates controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
