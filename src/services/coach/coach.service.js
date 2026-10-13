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
const { makeId } = require('../../utils/id')
const { query } = require('../../config/db')

class CoachService {
  static async getStats(coachId) {
    const [coursesCount, lessonsCount] = await Promise.all([
      Course.count({ where: { coach_id: coachId } }),
      Lesson.count({
        include: [{ model: Course, as: 'course', where: { coach_id: coachId }, attributes: [] }],
      }),
    ])

    const enrollmentsCount = await Enrollment.count({ where: { coach_id: coachId } })
    const revenueSum = await Payment.sum('amount', { where: { coach_id: coachId, status: 'success' } })

    return {
      stats: {
        totalCourses: coursesCount,
        totalLessons: lessonsCount,
        totalStudents: enrollmentsCount,
        totalEarnings: Number(revenueSum || 0),
      },
    }
  }

  static async listStudents(coachId) {
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

    return enrollments.map((e) => ({
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
  }

  static async getEarnings(coachId) {
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
      earnings: {
        total,
        history: payments,
      },
    }
  }
}

module.exports = CoachService
