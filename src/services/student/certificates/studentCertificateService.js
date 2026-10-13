'use strict'

const { Certificate, Course } = require('../../../models')

class StudentCertificateService {
  static async getStudentCertificates(studentId) {
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
      console.error('❌ Error in StudentCertificateService.getStudentCertificates:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = StudentCertificateService
