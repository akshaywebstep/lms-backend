'use strict'

const { ok, created, fail } = require('../../utils/response')
const LearningService = require('../../services/learning/learning.service')
const AssessmentService = require('../../services/learning/assessment.service')
const { Certificate, Upload, PlatformSetting } = require('../../models')
const { makeId } = require('../../utils/id')

// Lessons
const listCoachLessons = async (ctx) =>
  ok(ctx.res, { lessons: await LearningService.listLessonsForCoach(ctx.user.id, { courseId: ctx.query.get('courseId') }) })

const createCoachLesson = async (ctx) => {
  if (!ctx.body.courseId || !ctx.body.title) return fail(ctx.res, 400, 'Course and lesson title are required')
  const lesson = await LearningService.createLesson(ctx.user.id, ctx.body)
  if (!lesson) return fail(ctx.res, 404, 'Course not found for this coach')
  return created(ctx.res, { lesson })
}

const updateCoachLesson = async (ctx) => {
  const lesson = await LearningService.updateLesson(ctx.params.id, ctx.user.id, ctx.body)
  if (!lesson) return fail(ctx.res, 404, 'Lesson not found')
  return ok(ctx.res, { lesson })
}

const deleteCoachLesson = async (ctx) => {
  const removed = await LearningService.removeLesson(ctx.params.id, ctx.user.id)
  if (!removed) return fail(ctx.res, 404, 'Lesson not found')
  return ok(ctx.res, { success: true })
}

// Topics
const listCoachTopics = async (ctx) =>
  ok(ctx.res, {
    topics: await LearningService.listTopicsForCoach(ctx.user.id, {
      lessonId: ctx.query.get('lessonId'),
      courseId: ctx.query.get('courseId'),
    }),
  })

const createCoachTopic = async (ctx) => {
  if (!ctx.body.lessonId || !(ctx.body.title || ctx.body.name)) return fail(ctx.res, 400, 'Lesson and topic title are required')
  const topic = await LearningService.createTopic(ctx.user.id, ctx.body)
  if (!topic) return fail(ctx.res, 404, 'Lesson not found for this coach')
  return created(ctx.res, { topic })
}

const updateCoachTopic = async (ctx) => {
  const topic = await LearningService.updateTopic(ctx.params.id, ctx.user.id, ctx.body)
  if (!topic) return fail(ctx.res, 404, 'Topic not found')
  return ok(ctx.res, { topic })
}

const deleteCoachTopic = async (ctx) => {
  const removed = await LearningService.removeTopic(ctx.params.id, ctx.user.id)
  if (!removed) return fail(ctx.res, 404, 'Topic not found')
  return ok(ctx.res, { success: true })
}

// Quizzes
const listCoachQuizzes = async (ctx) =>
  ok(ctx.res, { quizzes: await AssessmentService.listQuizzesForCoach(ctx.user.id, { courseId: ctx.query.get('courseId') }) })

const getCoachQuiz = async (ctx) => {
  const quiz = await AssessmentService.getQuizDetail(ctx.params.id)
  if (!quiz) return fail(ctx.res, 404, 'Quiz not found')
  return ok(ctx.res, { quiz })
}

const createCoachQuiz = async (ctx) => {
  if (!ctx.body.courseId || !ctx.body.title) return fail(ctx.res, 400, 'Course ID and quiz title are required')
  const quiz = await AssessmentService.createQuiz(ctx.user.id, ctx.body)
  if (!quiz) return fail(ctx.res, 404, 'Course not found')
  return created(ctx.res, { quiz })
}

const updateCoachQuiz = async (ctx) => {
  const quiz = await AssessmentService.updateQuiz(ctx.params.id, ctx.user.id, ctx.body)
  if (!quiz) return fail(ctx.res, 404, 'Quiz not found')
  return ok(ctx.res, { quiz })
}

const deleteCoachQuiz = async (ctx) => {
  const removed = await AssessmentService.removeQuiz(ctx.params.id, ctx.user.id)
  if (!removed) return fail(ctx.res, 404, 'Quiz not found')
  return ok(ctx.res, { success: true })
}

// Materials
const listCoachMaterials = async (ctx) => {
  const uploads = await Upload.findAll({
    where: { owner_id: ctx.user.id },
    order: [['created_at', 'DESC']],
  })
  return ok(ctx.res, { materials: uploads, uploads })
}

const createCoachMaterial = async (ctx) => {
  const upload = await Upload.create({
    id: makeId('mat'),
    owner_id: ctx.user.id,
    file_type: ctx.body.fileType || 'document',
    original_name: ctx.body.originalName || 'file',
    file_url: ctx.body.fileUrl,
    mime_type: ctx.body.mimeType || 'application/octet-stream',
    size_bytes: ctx.body.sizeBytes || 0,
  })
  return created(ctx.res, { material: upload, upload })
}

const deleteCoachMaterial = async (ctx) => {
  await Upload.destroy({ where: { id: ctx.params.id, owner_id: ctx.user.id } })
  return ok(ctx.res, { success: true })
}

// Student Learning
const studentCourseContent = async (ctx) => {
  const content = await LearningService.getStudentCourseContent(ctx.user.id, ctx.params.courseId)
  if (!content) return fail(ctx.res, 404, 'Course not found')
  return ok(ctx.res, content)
}

const updateStudentLessonProgress = async (ctx) => {
  try {
    const result = await LearningService.updateStudentLessonProgress(ctx.user.id, ctx.params.id, ctx.body)
    if (!result) return fail(ctx.res, 404, 'Lesson or enrollment not found')
    return ok(ctx.res, result)
  } catch (err) {
    return fail(ctx.res, err.status || 400, err.message || 'Progress update failed')
  }
}

const listStudentQuizzes = async (ctx) =>
  ok(ctx.res, { quizzes: await AssessmentService.listStudentQuizzes(ctx.user.id) })

const attemptStudentQuiz = async (ctx) => {
  try {
    const attempt = await AssessmentService.attemptStudentQuiz(ctx.user.id, ctx.params.id, ctx.body)
    if (!attempt) return fail(ctx.res, 404, 'Quiz or enrollment not found')
    return ok(ctx.res, { attempt })
  } catch (err) {
    return fail(ctx.res, err.status || 400, err.message || 'Quiz attempt failed')
  }
}

const listStudentAssignments = async (ctx) =>
  ok(ctx.res, { assignments: await AssessmentService.listStudentAssignments(ctx.user.id) })

const submitStudentAssignment = async (ctx) => {
  try {
    const submission = await AssessmentService.submitStudentAssignment(ctx.user.id, ctx.params.id, ctx.body)
    if (!submission) return fail(ctx.res, 404, 'Assignment or enrollment not found')
    return created(ctx.res, { submission })
  } catch (err) {
    return fail(ctx.res, err.status || 400, err.message || 'Assignment submission failed')
  }
}

const listStudentCertificates = async (ctx) => {
  const certs = await Certificate.findAll({
    where: { student_id: ctx.user.id },
    order: [['issued_at', 'DESC']],
  })
  return ok(ctx.res, { certificates: certs })
}

module.exports = {
  listCoachLessons,
  createCoachLesson,
  updateCoachLesson,
  deleteCoachLesson,
  listCoachTopics,
  createCoachTopic,
  updateCoachTopic,
  deleteCoachTopic,
  listCoachQuizzes,
  getCoachQuiz,
  createCoachQuiz,
  updateCoachQuiz,
  deleteCoachQuiz,
  listCoachMaterials,
  createCoachMaterial,
  deleteCoachMaterial,
  studentCourseContent,
  updateStudentLessonProgress,
  listStudentQuizzes,
  attemptStudentQuiz,
  listStudentAssignments,
  submitStudentAssignment,
  listStudentCertificates,
}
