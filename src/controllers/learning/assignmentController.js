const { ok, created, fail } = require('../../utils/response')
const AssessmentService = require('../../services/learning/assessment.service')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.list = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const courseId = req.query?.courseId || (typeof req.query?.get === 'function' ? req.query.get('courseId') : null)
  const assignments = await AssessmentService.listAssignmentsForCoach(req.user.id, { courseId })
  return ok(res, { assignments }, 'Coach assignments fetched successfully.')
}

exports.create = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.courseId || !req.body?.title) return fail(res, 400, 'Course ID and title are required')
  const assignment = await AssessmentService.createAssignment(req.user.id, req.body)
  if (!assignment) return fail(res, 404, 'Course not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_ASSIGNMENT',
    module: 'assignments',
    description: `Coach created assignment '${assignment.title || req.body.title}'`,
    status: 'success',
    metadata: { assignmentId: assignment.id, courseId: req.body.courseId },
  })

  return created(res, { assignment }, 'Assignment created successfully.')
}

exports.update = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const assignment = await AssessmentService.updateAssignment(req.params.id, req.user.id, req.body)
  if (!assignment) return fail(res, 404, 'Assignment not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'UPDATE_ASSIGNMENT',
    module: 'assignments',
    description: `Coach updated assignment '${assignment.title || req.params.id}'`,
    status: 'success',
    metadata: { assignmentId: req.params.id },
  })

  return ok(res, { assignment }, 'Assignment updated successfully.')
}

exports.remove = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const removed = await AssessmentService.removeAssignment(req.params.id, req.user.id)
  if (!removed) return fail(res, 404, 'Assignment not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_ASSIGNMENT',
    module: 'assignments',
    description: `Coach deleted assignment ID ${req.params.id}`,
    status: 'success',
    metadata: { assignmentId: req.params.id },
  })

  return ok(res, { success: true }, 'Assignment deleted successfully.')
}

exports.reviewSubmission = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const submission = await AssessmentService.reviewSubmission(req.params.id, req.user.id, req.body)
  if (!submission) return fail(res, 404, 'Submission not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'REVIEW_ASSIGNMENT',
    module: 'assignments',
    description: `Coach reviewed submission ID ${req.params.id} (Grade: ${req.body?.grade || 'graded'})`,
    status: 'success',
    metadata: { submissionId: req.params.id, grade: req.body?.grade },
  })

  return ok(res, { submission }, 'Assignment submission reviewed successfully.')
}