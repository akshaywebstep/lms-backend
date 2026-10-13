'use strict'

const { ok, created, fail } = require('../utils/response')
const AssessmentService = require('../services/learning/assessment.service')

const list = async (ctx) =>
  ok(ctx.res, {
    assignments: await AssessmentService.listAssignmentsForCoach(ctx.user.id, {
      courseId: ctx.query.get('courseId'),
    }),
  })

const create = async (ctx) => {
  if (!ctx.body.courseId || !ctx.body.title) return fail(ctx.res, 400, 'Course ID and title are required')
  const assignment = await AssessmentService.createAssignment(ctx.user.id, ctx.body)
  if (!assignment) return fail(ctx.res, 404, 'Course not found')
  return created(ctx.res, { assignment })
}

const update = async (ctx) => {
  const assignment = await AssessmentService.updateAssignment(ctx.params.id, ctx.user.id, ctx.body)
  if (!assignment) return fail(ctx.res, 404, 'Assignment not found')
  return ok(ctx.res, { assignment })
}

const remove = async (ctx) => {
  const removed = await AssessmentService.removeAssignment(ctx.params.id, ctx.user.id)
  if (!removed) return fail(ctx.res, 404, 'Assignment not found')
  return ok(ctx.res, { success: true })
}

const reviewSubmission = async (ctx) => {
  const submission = await AssessmentService.reviewSubmission(ctx.params.id, ctx.user.id, ctx.body)
  if (!submission) return fail(ctx.res, 404, 'Submission not found')
  return ok(ctx.res, { submission })
}

module.exports = {
  list,
  create,
  update,
  remove,
  reviewSubmission,
}