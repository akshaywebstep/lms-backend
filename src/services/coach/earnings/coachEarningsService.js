'use strict'

const { Payment, User, Course } = require('../../../models')
const { Op } = require('sequelize')

class CoachEarningsService {
  static async getCoachEarnings(coachId) {
    try {
      const payments = await Payment.findAll({
        where: {
          coach_id: coachId,
          status: { [Op.in]: ['completed', 'success'] },
        },
        include: [
          { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
          { model: Course, as: 'course', attributes: ['id', 'title'] },
        ],
        order: [['created_at', 'DESC']],
      })

      const grossRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const platformFee = Math.round(grossRevenue * 0.1) // 10% platform fee
      const netRevenue = grossRevenue - platformFee

      const history = payments.map((p) => ({
        id: p.id,
        studentId: p.student_id,
        amount: Number(p.amount || 0),
        currency: p.currency,
        status: 'success',
        createdAt: p.created_at,
        student: p.student ? { name: p.student.name, email: p.student.email } : null,
        course: p.course ? { title: p.course.title } : null,
      }))

      return {
        status: true,
        message: 'Coach earnings fetched successfully.',
        data: {
          earnings: {
            grossRevenue,
            platformFee,
            netRevenue,
            total: netRevenue,
            history,
          },
        },
      }
    } catch (error) {
      console.error('❌ Error in CoachEarningsService.getCoachEarnings:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = CoachEarningsService
