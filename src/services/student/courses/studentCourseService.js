
const { Enrollment, Course, User } = require('../../../models')

/**
 * Get all courses a student is enrolled in
 * @param {string} studentId
 */
exports.getStudentCourses = async (studentId) => {
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
      course: e.course
        ? {
            id: e.course.id,
            title: e.course.title,
            category: e.course.category,
            difficulty: e.course.difficulty,
            thumbnailUrl: e.course.thumbnail_url,
            coach: e.course.coach,
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
      message: 'Enrolled courses fetched successfully.',
      data: { courses },
    }
  } catch (error) {
    console.error('❌ Error in studentCourseService.getStudentCourses:', error)
    return {
      status: false,
      message: error.message || 'Failed to fetch enrolled courses.',
      data: null,
    }
  }
}
