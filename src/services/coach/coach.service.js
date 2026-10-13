'use strict'

const {
  Course,
  Lesson,
  LessonTopic,
  Quiz,
  QuizQuestion,
  Assignment,
  Enrollment,
  Payment,
  User,
  UserProfile,
} = require('../../models')

class CoachService {
  /**
   * 1. Get Coach Dashboard Statistics
   */
  static async getCoachStats(coachId) {
    try {
      const [coursesCount, lessonsCount] = await Promise.all([
        Course.count({ where: { coach_id: coachId } }),
        Lesson.count({
          include: [{ model: Course, as: 'course', where: { coach_id: coachId }, attributes: [] }],
        }),
      ])

      const enrollmentsCount = await Enrollment.count({ where: { coach_id: coachId } })
      const revenueSum = await Payment.sum('amount', { where: { coach_id: coachId, status: 'success' } })

      return {
        status: true,
        message: 'Coach statistics fetched successfully.',
        data: {
          stats: {
            totalCourses: coursesCount,
            totalLessons: lessonsCount,
            totalStudents: enrollmentsCount,
            totalEarnings: Number(revenueSum || 0),
          },
        },
      }
    } catch (error) {
      console.error('❌ Error in CoachService.getCoachStats:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 2. List Enrolled Students for Coach
   */
  static async getCoachStudents(coachId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: { coach_id: coachId },
        include: [
          {
            model: User,
            as: 'student',
            include: [{ model: UserProfile, as: 'profile' }],
          },
          { model: Course, as: 'course', attributes: ['id', 'title'] },
        ],
        order: [['created_at', 'DESC']],
      })

      const students = enrollments.map((e) => ({
        enrollmentId: e.id,
        progress: Number(e.progress || 0),
        enrolledAt: e.enrolled_at,
        course: e.course ? { id: e.course.id, title: e.course.title } : null,
        student: e.student
          ? {
              id: e.student.id,
              name: e.student.name,
              email: e.student.email,
              avatar: e.student.avatar_url,
              phone: e.student.profile?.phone || '',
            }
          : null,
      }))

      return {
        status: true,
        message: 'Coach students fetched successfully.',
        data: { students },
      }
    } catch (error) {
      console.error('❌ Error in CoachService.getCoachStudents:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 3. Get Coach Earnings Overview
   */
  static async getCoachEarnings(coachId) {
    try {
      const payments = await Payment.findAll({
        where: { coach_id: coachId, status: 'success' },
        include: [
          { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
          { model: Course, as: 'course', attributes: ['id', 'title'] },
        ],
        order: [['created_at', 'DESC']],
      })

      const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

      return {
        status: true,
        message: 'Coach earnings fetched successfully.',
        data: {
          earnings: {
            total,
            history: payments,
          },
        },
      }
    } catch (error) {
      console.error('❌ Error in CoachService.getCoachEarnings:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = CoachService
