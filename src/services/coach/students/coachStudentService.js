'use strict'

const { Enrollment, User, UserProfile, Course } = require('../../../models')

class CoachStudentService {
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
        enrollment: {
          id: e.id,
          progress: Number(e.progress || 0),
          status: e.status,
          enrolledAt: e.enrolled_at,
        },
      }))

      return {
        status: true,
        message: 'Coach students fetched successfully.',
        data: { students },
      }
    } catch (error) {
      console.error('❌ Error in CoachStudentService.getCoachStudents:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = CoachStudentService
