
const { Enrollment, Course, User, Certificate, Payment } = require('../../../models')
const { Op } = require('sequelize')

/**
 * Get Student Dashboard Stats & Recent Activity
 * @param {string} studentId
 */
exports.getStudentDashboard = async (studentId) => {
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

    const totalProgress = enrollments.reduce((acc, curr) => acc + Number(curr.progress || 0), 0)
    const avgProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0

    const paymentsSum = await Payment.sum('amount', {
      where: { student_id: studentId, status: { [Op.in]: ['completed', 'success'] } },
    })
    const totalSpent = Number(paymentsSum || 0)

    return {
      status: true,
      message: 'Student dashboard statistics fetched successfully.',
      data: {
        stats: {
          enrolledCourses: enrollments.length,
          inProgressCourses: inProgress.length,
          completedCourses: completed.length,
          certificates: certificatesCount,
          avgProgress,
          totalSpent,
        },
        recentEnrollments: enrollments.slice(0, 5),
      },
    }
  } catch (error) {
    console.error('❌ Error in studentDashboardService.getStudentDashboard:', error)
    return {
      status: false,
      message: error.message || 'Failed to fetch student dashboard.',
      data: null,
    }
  }
}
