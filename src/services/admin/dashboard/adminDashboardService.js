'use strict'

const { User, Course, Payment, Enrollment } = require('../../../models')
const { Op } = require('sequelize')

class AdminDashboardService {
  static async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalCoaches,
        totalStudents,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalPayments,
      ] = await Promise.all([
        User.count(),
        User.count({ where: { role: 'coach' } }),
        User.count({ where: { role: 'student' } }),
        Course.count(),
        Course.count({ where: { status: 'published' } }),
        Enrollment.count(),
        Payment.count({ where: { status: { [Op.in]: ['completed', 'success'] } } }),
      ])

      const revenueSum = await Payment.sum('amount', {
        where: { status: { [Op.in]: ['completed', 'success'] } },
      })
      const totalRevenue = Number(revenueSum || 0)

      const recentUsers = await User.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
      })

      const recentPayments = await Payment.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
          { model: Course, as: 'course', attributes: ['id', 'title'] },
        ],
      })

      return {
        status: true,
        message: 'Dashboard statistics fetched successfully.',
        data: {
          stats: {
            totalUsers,
            totalCoaches,
            totalStudents,
            totalCourses,
            publishedCourses,
            totalEnrollments,
            totalPayments,
            totalRevenue,
            // Direct aliases so frontend can read stats.coaches, stats.students, stats.revenue, stats.enrollments, stats.courses directly
            coaches: totalCoaches,
            students: totalStudents,
            courses: totalCourses,
            enrollments: totalEnrollments,
            revenue: totalRevenue,
          },
          recentUsers,
          recentPayments,
        },
      }
    } catch (error) {
      console.error('❌ Error in AdminDashboardService.getDashboardStats:', error)
      return { status: false, message: error.message }
    }
  }

  static async getReports() {
    try {
      const revenueSum = await Payment.sum('amount', {
        where: { status: { [Op.in]: ['completed', 'success'] } },
      })
      const courses = await Course.findAll({
        include: [
          { model: Enrollment, as: 'enrollments', attributes: ['id'] },
          { model: Payment, as: 'payments', attributes: ['amount', 'status'] },
        ],
      })

      const courseSales = courses.map((c) => {
        const sales = (c.enrollments || []).length
        const rev = (c.payments || [])
          .filter((p) => p.status === 'completed' || p.status === 'success')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
        return {
          id: c.id,
          title: c.title,
          sales,
          revenue: rev,
        }
      })

      return {
        status: true,
        data: {
          reports: {
            revenue: Number(revenueSum || 0),
            courseSales,
          },
        },
      }
    } catch (error) {
      return { status: false, message: error.message }
    }
  }
}

module.exports = AdminDashboardService
