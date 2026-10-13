'use strict'

const {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Course,
  Lesson,
  User,
  Certificate,
  Enrollment,
} = require('../../models')
const { makeId } = require('../../utils/id')
const { Op } = require('sequelize')

class AssessmentService {
  // Quizzes for Coach
  static async listQuizzesForCoach(coachId, { courseId } = {}) {
    const where = {}
    if (courseId) where.course_id = courseId

    const quizzes = await Quiz.findAll({
      where,
      include: [
        { model: Course, as: 'course', where: { coach_id: coachId }, attributes: ['id', 'title'] },
        { model: QuizQuestion, as: 'questions' },
      ],
      order: [['created_at', 'DESC']],
    })

    return quizzes.map((q) => ({
      id: q.id,
      courseId: q.course_id,
      lessonId: q.lesson_id,
      title: q.title,
      description: q.description,
      passingScore: Number(q.passing_score),
      dripDays: q.drip_days,
      status: q.status,
      course: q.course,
      questionsCount: (q.questions || []).length,
    }))
  }

  static async getQuizDetail(quizId) {
    const quiz = await Quiz.findOne({
      where: { id: quizId },
      include: [{ model: QuizQuestion, as: 'questions' }],
      order: [[{ model: QuizQuestion, as: 'questions' }, 'sort_order', 'ASC']],
    })
    if (!quiz) return null
    const plain = quiz.toJSON()
    return {
      id: plain.id,
      courseId: plain.course_id,
      lessonId: plain.lesson_id,
      title: plain.title,
      description: plain.description,
      passingScore: Number(plain.passing_score),
      dripDays: plain.drip_days,
      status: plain.status,
      questions: plain.questions || [],
    }
  }

  static async createQuiz(coachId, body) {
    const course = await Course.findOne({ where: { id: body.courseId, coach_id: coachId } })
    if (!course) return null

    const quizId = makeId('quiz')
    const quiz = await Quiz.create({
      id: quizId,
      course_id: body.courseId,
      lesson_id: body.lessonId || null,
      title: body.title,
      description: body.description || null,
      passing_score: body.passingScore || 50.0,
      drip_days: body.dripDays || 0,
      status: body.status || 'published',
    })

    if (Array.isArray(body.questions)) {
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i]
        await QuizQuestion.create({
          id: makeId('q_item'),
          quiz_id: quizId,
          question_text: q.questionText || q.question || '',
          question_type: q.questionType || 'mcq',
          options_json: q.options || q.optionsJson || [],
          correct_answer_json: q.correctAnswer || q.correctAnswerJson || null,
          marks: q.marks || 1.0,
          sort_order: i,
        })
      }
    }

    return this.getQuizDetail(quizId)
  }

  static async updateQuiz(quizId, coachId, body) {
    const quiz = await Quiz.findOne({
      where: { id: quizId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!quiz) return null

    const updates = {}
    if (body.title) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.passingScore !== undefined) updates.passing_score = body.passingScore
    if (body.dripDays !== undefined) updates.drip_days = body.dripDays
    if (body.status) updates.status = body.status

    await Quiz.update(updates, { where: { id: quizId } })

    if (Array.isArray(body.questions)) {
      await QuizQuestion.destroy({ where: { quiz_id: quizId } })
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i]
        await QuizQuestion.create({
          id: makeId('q_item'),
          quiz_id: quizId,
          question_text: q.questionText || q.question || '',
          question_type: q.questionType || 'mcq',
          options_json: q.options || q.optionsJson || [],
          correct_answer_json: q.correctAnswer || q.correctAnswerJson || null,
          marks: q.marks || 1.0,
          sort_order: i,
        })
      }
    }

    return this.getQuizDetail(quizId)
  }

  static async removeQuiz(quizId, coachId) {
    const quiz = await Quiz.findOne({
      where: { id: quizId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!quiz) return false
    await QuizQuestion.destroy({ where: { quiz_id: quizId } })
    await Quiz.destroy({ where: { id: quizId } })
    return true
  }

  // Assignments for Coach
  static async listAssignmentsForCoach(coachId, { courseId } = {}) {
    const where = {}
    if (courseId) where.course_id = courseId

    const assignments = await Assignment.findAll({
      where,
      include: [
        { model: Course, as: 'course', where: { coach_id: coachId }, attributes: ['id', 'title'] },
        {
          model: AssignmentSubmission,
          as: 'submissions',
          include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'avatar_url'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    })

    return assignments.map((a) => {
      const plain = a.toJSON()
      return {
        id: plain.id,
        courseId: plain.course_id,
        lessonId: plain.lesson_id,
        title: plain.title,
        description: plain.description,
        attachmentUrl: plain.attachment_url,
        attachmentName: plain.attachment_name,
        dueAt: plain.due_at,
        dripDays: plain.drip_days,
        maxScore: Number(plain.max_score),
        status: plain.status,
        course: plain.course,
        submissions: plain.submissions || [],
        submissionsCount: (plain.submissions || []).length,
      }
    })
  }

  static async createAssignment(coachId, body) {
    const course = await Course.findOne({ where: { id: body.courseId, coach_id: coachId } })
    if (!course) return null

    const assignmentId = makeId('assign')
    const created = await Assignment.create({
      id: assignmentId,
      course_id: body.courseId,
      lesson_id: body.lessonId || null,
      title: body.title,
      description: body.description || null,
      attachment_url: body.attachmentUrl || null,
      attachment_name: body.attachmentName || null,
      due_at: body.dueAt || null,
      drip_days: body.dripDays || 0,
      max_score: body.maxScore || 100.0,
      status: body.status || 'published',
    })

    return created
  }

  static async updateAssignment(assignmentId, coachId, body) {
    const assignment = await Assignment.findOne({
      where: { id: assignmentId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!assignment) return null

    const updates = {}
    if (body.title) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.attachmentUrl !== undefined) updates.attachment_url = body.attachmentUrl
    if (body.attachmentName !== undefined) updates.attachment_name = body.attachmentName
    if (body.dueAt !== undefined) updates.due_at = body.dueAt
    if (body.dripDays !== undefined) updates.drip_days = body.dripDays
    if (body.maxScore !== undefined) updates.max_score = body.maxScore
    if (body.status) updates.status = body.status

    await Assignment.update(updates, { where: { id: assignmentId } })
    return Assignment.findByPk(assignmentId)
  }

  static async removeAssignment(assignmentId, coachId) {
    const assignment = await Assignment.findOne({
      where: { id: assignmentId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!assignment) return false
    await AssignmentSubmission.destroy({ where: { assignment_id: assignmentId } })
    await Assignment.destroy({ where: { id: assignmentId } })
    return true
  }

  static async reviewSubmission(submissionId, coachId, body) {
    const sub = await AssignmentSubmission.findByPk(submissionId)
    if (!sub) return null

    const updates = {
      score: body.score !== undefined ? body.score : sub.score,
      feedback: body.feedback !== undefined ? body.feedback : sub.feedback,
      status: 'graded',
      graded_at: new Date(),
    }
    await sub.update(updates)
    return sub
  }

  // Student assessments
  static async listStudentQuizzes(studentId) {
    const enrollments = await Enrollment.findAll({ where: { student_id: studentId } })
    const courseIds = enrollments.map((e) => e.course_id)

    const quizzes = await Quiz.findAll({
      where: { course_id: { [Op.in]: courseIds } },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: QuizAttempt, as: 'attempts', where: { student_id: studentId }, required: false },
      ],
    })

    return quizzes
  }

  static async attemptStudentQuiz(studentId, quizId, body) {
    const quiz = await Quiz.findByPk(quizId)
    if (!quiz) return null

    const enrollment = await Enrollment.findOne({
      where: { student_id: studentId, course_id: quiz.course_id },
    })
    if (!enrollment) return null

    const attemptId = makeId('q_att')
    const attempt = await QuizAttempt.create({
      id: attemptId,
      quiz_id: quizId,
      student_id: studentId,
      enrollment_id: enrollment.id,
      answers_json: body.answers || {},
      score: body.score || 0.0,
      status: 'completed',
      submitted_at: new Date(),
    })

    return attempt
  }

  static async listStudentAssignments(studentId) {
    const enrollments = await Enrollment.findAll({ where: { student_id: studentId } })
    const courseIds = enrollments.map((e) => e.course_id)

    const assignments = await Assignment.findAll({
      where: { course_id: { [Op.in]: courseIds } },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        {
          model: AssignmentSubmission,
          as: 'submissions',
          where: { student_id: studentId },
          required: false,
        },
      ],
    })

    return assignments
  }

  static async submitStudentAssignment(studentId, assignmentId, body) {
    const assignment = await Assignment.findByPk(assignmentId)
    if (!assignment) return null

    const enrollment = await Enrollment.findOne({
      where: { student_id: studentId, course_id: assignment.course_id },
    })
    if (!enrollment) return null

    const subId = makeId('sub')
    const sub = await AssignmentSubmission.create({
      id: subId,
      assignment_id: assignmentId,
      student_id: studentId,
      enrollment_id: enrollment.id,
      answer_text: body.answerText || body.text || null,
      file_url: body.fileUrl || null,
      status: 'submitted',
      submitted_at: new Date(),
    })

    return sub
  }
}

module.exports = AssessmentService
