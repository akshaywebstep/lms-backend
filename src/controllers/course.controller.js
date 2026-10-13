'use strict'

const { ok, created, fail } = require('../utils/response')
const CourseService = require('../services/course.service')

const createCourse = async (ctx) => {
  if (!ctx.body.title || !ctx.body.category || !ctx.body.description) {
    return fail(ctx.res, 400, 'Title, category and description are required')
  }
  const course = await CourseService.createCourse(ctx.user.id, ctx.body)
  return created(ctx.res, { course })
}

const coachCourses = async (ctx) =>
  ok(ctx.res, { courses: await CourseService.listCoachCourses(ctx.user.id) })

const coachCourseDetail = async (ctx) => {
  const course = await CourseService.getCourseDetail(ctx.params.id)
  if (!course || course.coachId !== ctx.user.id) return fail(ctx.res, 404, 'Course not found')
  return ok(ctx.res, { course })
}

const updateCoachCourse = async (ctx) => {
  const course = await CourseService.updateCourse(ctx.params.id, ctx.user.id, ctx.body)
  if (!course) return fail(ctx.res, 404, 'Course not found')
  return ok(ctx.res, { course })
}

const browseCourses = async (ctx) =>
  ok(ctx.res, {
    courses: await CourseService.browseCourses(ctx.user.id, {
      search: ctx.query.get('search'),
      category: ctx.query.get('category'),
      difficulty: ctx.query.get('difficulty'),
      language: ctx.query.get('language'),
    }),
  })

const allCourses = async (ctx) =>
  ok(ctx.res, {
    courses: await CourseService.listAllCourses({
      search: ctx.query.get('search'),
      status: ctx.query.get('status'),
    }),
  })

const adminCourseDetail = async (ctx) => {
  const course = await CourseService.getCourseDetail(ctx.params.id)
  if (!course) return fail(ctx.res, 404, 'Course not found')
  return ok(ctx.res, { course })
}

const updateAdminCourse = async (ctx) => {
  const current = await CourseService.getCourseDetail(ctx.params.id)
  if (!current) return fail(ctx.res, 404, 'Course not found')
  const course = await CourseService.updateCourse(ctx.params.id, current.coachId, ctx.body)
  return ok(ctx.res, { course })
}

module.exports = {
  createCourse,
  coachCourses,
  coachCourseDetail,
  updateCoachCourse,
  browseCourses,
  allCourses,
  adminCourseDetail,
  updateAdminCourse,
}