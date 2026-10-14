
const {
  Enrollment,
  User,
  UserProfile,
  Course,
  Lesson,
  LessonProgress,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
} = require('../../../models')

/**
 * 1. Get Coach Students List
 * @param {string} coachId
 */
exports.getCoachStudents = async (coachId) => {
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

    const uniqueStudentIds = new Set(enrollments.map((e) => e.student_id)).size
    const stats = {
      students: uniqueStudentIds,
      enrollments: enrollments.length,
    }

    return {
      status: true,
      message: 'Coach students fetched successfully.',
      data: {
        students,
        stats,
      },
    }
  } catch (error) {
    console.error('❌ Error in coachStudentService.getCoachStudents:', error)
    return {
      status: false,
      message: error.message || 'Failed to fetch coach students.',
      data: null,
    }
  }
}

/**
 * 2. Get Student Progress Report for Coach
 * @param {string} coachId
 * @param {string} studentId
 * @param {string|null} courseId
 */
exports.getStudentProgress = async (coachId, studentId, courseId = null) => {
  try {
    const studentUser = await User.findByPk(studentId, {
      include: [{ model: UserProfile, as: 'profile' }],
    })
    if (!studentUser) {
      return { status: false, message: 'Student not found.', data: null }
    }

    const enrollWhere = { student_id: studentId, coach_id: coachId }
    const enrollments = await Enrollment.findAll({
      where: enrollWhere,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'slug', 'thumbnail_url', 'difficulty', 'category'],
        },
      ],
      order: [['created_at', 'DESC']],
    })

    if (!enrollments.length) {
      return {
        status: false,
        message: 'No course enrollments found for this student with your coach profile.',
        data: null,
      }
    }

    let selectedEnrollment = enrollments[0]
    if (courseId) {
      const found = enrollments.find(
        (e) => e.course_id === courseId || e.course?.id === courseId
      )
      if (found) selectedEnrollment = found
    }

    const activeCourse = selectedEnrollment.course
    const enrollmentId = selectedEnrollment.id

    // Lessons
    const lessons = await Lesson.findAll({
      where: { course_id: activeCourse.id },
      order: [['sort_order', 'ASC']],
    })

    const lessonProgressRecords = await LessonProgress.findAll({
      where: { enrollment_id: enrollmentId },
    })
    const progressMap = new Map(lessonProgressRecords.map((lp) => [lp.lesson_id, lp]))

    let totalWatchedSeconds = 0
    let completedLessonsCount = 0

    const lessonList = lessons.map((l) => {
      const prog = progressMap.get(l.id)
      const isCompleted = prog?.status === 'completed'
      if (isCompleted) completedLessonsCount++
      const watchedSec = Number(prog?.watched_seconds || 0)
      totalWatchedSeconds += watchedSec

      let status = 'not-started'
      if (isCompleted) {
        status = 'completed'
      } else if (watchedSec > 0 || prog?.status === 'in_progress') {
        status = 'in-progress'
      }

      return {
        id: l.id,
        title: l.title,
        status,
        duration: `${l.duration_minutes || 0}m`,
        durationMinutes: l.duration_minutes || 0,
        completedAt: prog?.completed_at || null,
        sortOrder: l.sort_order,
        contentType: l.content_type,
      }
    })

    // Quizzes
    const quizzes = await Quiz.findAll({
      where: { course_id: activeCourse.id },
    })
    const quizAttempts = await QuizAttempt.findAll({
      where: { enrollment_id: enrollmentId },
      order: [['created_at', 'DESC']],
    })

    let totalQuizScore = 0
    let scoredQuizzesCount = 0
    let completedQuizzesCount = 0

    const quizList = quizzes.map((q) => {
      const attempt = quizAttempts.find((qa) => qa.quiz_id === q.id)
      if (attempt && (attempt.status === 'completed' || attempt.status === 'graded')) {
        completedQuizzesCount++
        const score = Number(attempt.score || 0)
        totalQuizScore += score
        scoredQuizzesCount++
        return {
          id: q.id,
          title: q.title,
          score,
          maxScore: 100,
          submittedAt: attempt.submitted_at || attempt.created_at,
          status: 'completed',
        }
      }
      return {
        id: q.id,
        title: q.title,
        score: null,
        maxScore: 100,
        submittedAt: null,
        status: 'pending',
      }
    })

    // Assignments
    const assignments = await Assignment.findAll({
      where: { course_id: activeCourse.id },
    })
    const submissions = await AssignmentSubmission.findAll({
      where: { enrollment_id: enrollmentId },
      order: [['created_at', 'DESC']],
    })

    let submittedAssignmentsCount = 0
    const assignmentList = assignments.map((a) => {
      const sub = submissions.find((s) => s.assignment_id === a.id)
      if (sub) {
        submittedAssignmentsCount++
        return {
          id: a.id,
          title: a.title,
          status: sub.status || 'submitted',
          grade: sub.score !== null && sub.score !== undefined ? `${sub.score}%` : sub.status === 'graded' ? 'Graded' : 'Submitted',
          submittedAt: sub.submitted_at || sub.created_at,
        }
      }
      return {
        id: a.id,
        title: a.title,
        status: 'pending',
        grade: null,
        submittedAt: null,
      }
    })

    // Duration string
    const hours = Math.floor(totalWatchedSeconds / 3600)
    const minutes = Math.floor((totalWatchedSeconds % 3600) / 60)
    const timeSpent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

    // Overall Progress
    const calculatedPercent =
      lessons.length > 0
        ? Math.round((completedLessonsCount / lessons.length) * 100)
        : Number(selectedEnrollment.progress || 0)
    const overallPercent = Math.min(
      100,
      Math.max(Number(selectedEnrollment.progress || 0), calculatedPercent)
    )

    const avgQuizScore =
      scoredQuizzesCount > 0 ? Math.round(totalQuizScore / scoredQuizzesCount) : 0

    const streak = completedLessonsCount > 0 ? Math.min(7, completedLessonsCount) : 1

    return {
      status: true,
      message: 'Student progress loaded successfully.',
      data: {
        student: {
          id: studentUser.id,
          name: studentUser.name,
          email: studentUser.email,
          avatar: studentUser.avatar_url,
          phone: studentUser.profile?.phone || '',
          enrolledDate: selectedEnrollment.enrolled_at || selectedEnrollment.created_at,
          lastActive:
            studentUser.last_login_at ||
            selectedEnrollment.updated_at ||
            selectedEnrollment.created_at,
        },
        course: {
          id: activeCourse.id,
          title: activeCourse.title,
          totalLessons: lessons.length,
          totalQuizzes: quizzes.length,
          totalAssignments: assignments.length,
        },
        allCourses: enrollments.map((e) => ({
          id: e.course?.id,
          title: e.course?.title,
          progress: Number(e.progress || 0),
        })),
        progress: {
          overallPercent,
          lessonsCompleted: completedLessonsCount,
          quizzesCompleted: completedQuizzesCount,
          assignmentsSubmitted: submittedAssignmentsCount,
          avgQuizScore,
          timeSpent:
            totalWatchedSeconds > 0
              ? timeSpent
              : completedLessonsCount > 0
              ? `${completedLessonsCount * 15}m`
              : '0m',
          streak,
        },
        lessons: lessonList,
        quizzes: quizList,
        assignments: assignmentList,
      },
    }
  } catch (error) {
    console.error('❌ Error in coachStudentService.getStudentProgress:', error)
    return {
      status: false,
      message: error.message || 'Failed to load student progress.',
      data: null,
    }
  }
}
