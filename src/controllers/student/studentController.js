'use strict'

const StudentService = require('../../services/student/student.service')
const learningModel = require('../../models/learning.model')
const enrollmentModel = require('../../models/enrollment.model')
const progressModel = require('../../models/progress.model')
const quizModel = require('../../models/quiz.model')
const assignmentModel = require('../../models/assignment.model')
const resourceModel = require('../../models/resource.model')
const { ok, created, fail } = require('../../utils/response')

const dashboard = async (ctx) => {
  const data = await StudentService.getDashboard(ctx.user.id)
  return ok(ctx.res, data)
}

const myCourses = async (ctx) => {
  const data = await StudentService.listCourses(ctx.user.id)
  return ok(ctx.res, { courses: data })
}

const learnCourse = async (ctx) => {
  const data = await learningModel.listLessonsForStudentCourse(ctx.user.id, ctx.params.id)
  if (!data) return fail(ctx.res, 403, 'Enrollment required')
  return ok(ctx.res, data)
}

const enroll = async (ctx) => {
  const enrollment = await enrollmentModel.enrollStudent(ctx.user.id, ctx.params.id, ctx.body)
  return created(ctx.res, { enrollment })
}

const updateProgress = async (ctx) => {
  const progress = await progressModel.updateLessonProgress(ctx.user.id, ctx.params.id, ctx.body)
  return ok(ctx.res, { progress })
}

const getQuiz = async (ctx) => {
  const quiz = await quizModel.getForStudent(ctx.params.id, ctx.user.id)
  if (!quiz) return fail(ctx.res, 404, 'Quiz not found')
  return ok(ctx.res, { quiz })
}

const submitQuiz = async (ctx) => {
  const attempt = await quizModel.submitAttempt(ctx.params.id, ctx.user.id, ctx.body)
  return ok(ctx.res, { attempt })
}

const submitAssignment = async (ctx) => {
  const submission = await assignmentModel.submit(ctx.params.id, ctx.user.id, ctx.body)
  return created(ctx.res, { submission })
}

const certificates = async (ctx) => {
  await resourceModel.ensureCertificateFiles(ctx.user.id)
  return ok(ctx.res, { certificates: await resourceModel.listCertificatesForStudent(ctx.user.id) })
}

const progress = async (ctx) =>
  ok(ctx.res, { progress: await progressModel.getStudentOverview(ctx.user.id) })

module.exports = {
  dashboard,
  myCourses,
  learnCourse,
  enroll,
  updateProgress,
  getQuiz,
  submitQuiz,
  submitAssignment,
  certificates,
  progress,
}
