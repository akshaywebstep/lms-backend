
const { Course, Lesson, Enrollment, Payment } = require('../../../models')
const { Op } = require('sequelize')

/**
 * Get Coach Dashboard Statistics
 * @param {string} coachId
 */
exports.getCoachStats = async (coachId) => {
  try {
    const [coursesCount, publishedCoursesCount, lessonsCount] = await Promise.all([
      Course.count({ where: { coach_id: coachId } }),
      Course.count({ where: { coach_id: coachId, status: 'published' } }),
      Lesson.count({
        include: [{ model: Course, as: 'course', where: { coach_id: coachId }, attributes: [] }],
      }),
    ])

    const enrollmentsCount = await Enrollment.count({ where: { coach_id: coachId } })
    const revenueSum = await Payment.sum('amount', {
      where: { coach_id: coachId, status: { [Op.in]: ['completed', 'success'] } },
    })
    const revenue = Number(revenueSum || 0)

    return {
      status: true,
      message: 'Coach statistics fetched successfully.',
      data: {
        stats: {
          totalCourses: coursesCount,
          totalLessons: lessonsCount,
          totalStudents: enrollmentsCount,
          totalEarnings: revenue,
          publishedCourses: publishedCoursesCount,
          // direct aliases for frontend compatibility
          courses: coursesCount,
          students: enrollmentsCount,
          enrollments: enrollmentsCount,
          revenue,
        },
      },
    }
  } catch (error) {
    console.error('❌ Error in coachDashboardService.getCoachStats:', error)
    return {
      status: false,
      message: error.message || 'Failed to fetch coach statistics.',
      data: null,
    }
  }
}
