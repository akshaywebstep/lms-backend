
const { Certificate, Course } = require('../../../models')

/**
 * Get all certificates earned by student
 * @param {string} studentId
 */
exports.getStudentCertificates = async (studentId) => {
  try {
    const certificates = await Certificate.findAll({
      where: { student_id: studentId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
      order: [['issued_at', 'DESC']],
    })

    return {
      status: true,
      message: 'Student certificates fetched successfully.',
      data: { certificates },
    }
  } catch (error) {
    console.error('❌ Error in studentCertificateService.getStudentCertificates:', error)
    return {
      status: false,
      message: error.message || 'Failed to fetch student certificates.',
      data: null,
    }
  }
}
