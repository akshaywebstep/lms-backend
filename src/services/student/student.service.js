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

class StudentService {
  /**
   * 1. Get Student Dashboard Overview
   */
  static async getStudentDashboard(studentId) {
    try {
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
        status: true,
        message: 'Student dashboard fetched successfully.',
        data: {
          stats: {
            enrolledCourses: enrollments.length,
            inProgressCourses: inProgress.length,
            completedCourses: completed.length,
            certificates: certificatesCount,
          },
          recentEnrollments: enrollments.slice(0, 5),
        },
      }
    } catch (error) {
      console.error('❌ Error in StudentService.getStudentDashboard:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 2. List Enrolled Courses for Student
   */
  static async getStudentCourses(studentId) {
    try {
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

      const courses = enrollments.map((e) => ({
        enrollmentId: e.id,
        progress: Number(e.progress || 0),
        status: e.status,
        enrolledAt: e.enrolled_at,
        course: e.course ? e.course.toJSON() : null,
      }))

      return {
        status: true,
        message: 'Student courses fetched successfully.',
        data: { courses },
      }
    } catch (error) {
      console.error('❌ Error in StudentService.getStudentCourses:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 3. List Student Certificates
   */
  static async getStudentCertificates(studentId) {
    try {
      const certificates = await Certificate.findAll({
        where: { student_id: studentId },
        include: [{ model: Course, as: 'course' }],
        order: [['issued_at', 'DESC']],
      })

      return {
        status: true,
        message: 'Student certificates fetched successfully.',
        data: { certificates },
      }
    } catch (error) {
      console.error('❌ Error in StudentService.getStudentCertificates:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = StudentService
