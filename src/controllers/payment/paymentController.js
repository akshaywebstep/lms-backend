const PaymentService = require('../../services/payment/payment.service')
const { ok, created, fail } = require('../../utils/response')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.checkout = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const result = await PaymentService.checkout(req.user, req.body)

    await logActivity({
      req,
      userId: req.user.id,
      role: req.user.role,
      action: 'COURSE_ENROLLMENT',
      module: 'payments',
      description: `Student ${req.user.name} enrolled in course (Amount: ₹${result.payment?.amount || req.body?.amount || 0})`,
      status: 'success',
      metadata: { courseId: req.body?.courseId, paymentId: result.payment?.id },
    })

    return ok(res, result, 'Course enrollment completed successfully.')
  } catch (err) {
    return fail(res, err.status || 500, err.message)
  }
}

exports.createOrder = async (rawReq, rawRes) => {
  return exports.checkout(rawReq, rawRes)
}

exports.verify = async (rawReq, rawRes) => {
  const { res } = getReqRes(rawReq, rawRes)
  return ok(res, { success: true, verified: true }, 'Payment verified successfully.')
}

exports.enroll = async (rawReq, rawRes) => {
  return exports.checkout(rawReq, rawRes)
}

exports.history = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const payments = await PaymentService.listPaymentsForUser(req.user.id)
  return ok(res, { payments, history: payments }, 'Payment history fetched successfully.')
}