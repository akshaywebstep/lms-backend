const { ok, created, fail } = require('../../utils/response')
const CourseService = require('../../services/course/courseService')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

const getQueryParam = (req, key) => {
  if (req.query && req.query[key] !== undefined) return req.query[key]
  if (typeof req.query?.get === 'function') return req.query.get(key)
  return null
}

exports.createCourse = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.title || !req.body?.category || !req.body?.description) {
    return fail(res, 400, 'Title, category and description are required')
  }
  const course = await CourseService.createCourse(req.user.id, req.body)

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_COURSE',
    module: 'courses',
    description: `Coach created new course '${course.title}'`,
    status: 'success',
    metadata: { courseId: course.id, title: course.title, category: course.category },
  })

  return created(res, { course }, 'Course created successfully.')
}

exports.coachCourses = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const courses = await CourseService.listCoachCourses(req.user.id)
  return ok(res, { courses }, 'Coach courses fetched successfully.')
}

exports.coachCourseDetail = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const course = await CourseService.getCourseDetail(req.params.id)
  if (!course || course.coachId !== req.user.id) return fail(res, 404, 'Course not found')
  return ok(res, { course }, 'Course details fetched successfully.')
}

exports.updateCoachCourse = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const course = await CourseService.updateCourse(req.params.id, req.user.id, req.body)
    if (!course) return fail(res, 404, 'Course not found')

    await logActivity({
      req,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_COURSE',
      module: 'courses',
      description: `Coach updated course '${course.title}'`,
      status: 'success',
      metadata: { courseId: course.id, title: course.title },
    })

    return ok(res, { course }, 'Course updated successfully.')
  } catch (err) {
    return fail(res, err.status || 400, err.message || 'Failed to update course')
  }
}

exports.browseCourses = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const courses = await CourseService.browseCourses(req.user.id, {
    search: getQueryParam(req, 'search'),
    category: getQueryParam(req, 'category'),
    difficulty: getQueryParam(req, 'difficulty'),
    language: getQueryParam(req, 'language'),
  })
  return ok(res, { courses }, 'Browse courses fetched successfully.')
}

exports.allCourses = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const courses = await CourseService.listAllCourses({
    search: getQueryParam(req, 'search'),
    status: getQueryParam(req, 'status'),
  })
  return ok(res, { courses }, 'All courses fetched successfully.')
}

exports.adminCourseDetail = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const course = await CourseService.getCourseDetail(req.params.id)
  if (!course) return fail(res, 404, 'Course not found')
  return ok(res, { course }, 'Admin course detail fetched successfully.')
}

exports.updateAdminCourse = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const current = await CourseService.getCourseDetail(req.params.id)
    if (!current) return fail(res, 404, 'Course not found')
    const course = await CourseService.updateCourse(req.params.id, current.coachId, req.body)

    await logActivity({
      req,
      userId: req.user.id,
      role: req.user.role,
      action: 'ADMIN_UPDATE_COURSE',
      module: 'courses',
      description: `Admin updated course '${course.title}'`,
      status: 'success',
      metadata: { courseId: course.id, title: course.title },
    })

    return ok(res, { course }, 'Admin course updated successfully.')
  } catch (err) {
    return fail(res, err.status || 400, err.message || 'Failed to update course')
  }
}