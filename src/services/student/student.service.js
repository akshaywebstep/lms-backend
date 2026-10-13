'use strict'

const {
  Enrollment,
  Course,
  Lesson,
  User,
  Certificate,
  Payment,
  Quiz,
  Assignment,
} = require('../../models')
const { query, first } = require('../../config/db')

class StudentService {
  static async getDashboard(studentId) {
    const enrollments = await Enrollment.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: Course,
          as: 'course',
          include: [{ model: User, as: 'coach', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    })

    const certificatesCount = await Certificate.count({ where: { student_id: studentId } })

    const inProgress = enrollments.filter((e) => e.status === 'active' && Number(e.progress) < 100)
    const completed = enrollments.filter((e) => Number(e.progress) >= 100)

    return {
      stats: {
        enrolledCourses: enrollments.length,
        inProgressCourses: inProgress.length,
        completedCourses: completed.length,
        certificates: certificatesCount,
      },
      recentEnrollments: enrollments.slice(0, 5),
    }
  }

  static async listCourses(studentId) {
    const enrollments = await Enrollment.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: Course,
          as: 'course',
          include: [{ model: User, as: 'coach', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    })

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      progress: Number(e.progress || 0),
      status: e.status,
      enrolledAt: e.enrolled_at,
      course: e.course ? e.course.toJSON() : null,
    }))
  }

  static async listCertificates(studentId) {
    const certificates = await Certificate.findAll({
      where: { student_id: studentId },
      include: [{ model: Course, as: 'course' }],
      order: [['issued_at', 'DESC']],
    })
    return certificates
  }
}

module.exports = StudentService
