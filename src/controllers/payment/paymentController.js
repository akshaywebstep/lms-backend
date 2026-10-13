'use strict'

const PaymentService = require('../../services/payment/payment.service')
const { ok, created, fail } = require('../../utils/response')

const checkout = async (ctx) => {
  try {
    const result = await PaymentService.checkout(ctx.user, ctx.body)
    return ok(ctx.res, result)
  } catch (err) {
    return fail(ctx.res, err.status || 500, err.message)
  }
}

const createOrder = async (ctx) => {
  return checkout(ctx)
}

const verify = async (ctx) => {
  return ok(ctx.res, { success: true, verified: true })
}

const enroll = async (ctx) => {
  return checkout(ctx)
}

const history = async (ctx) => {
  const payments = await PaymentService.listPaymentsForUser(ctx.user.id)
  return ok(ctx.res, { payments, history: payments })
}

module.exports = {
  checkout,
  createOrder,
  verify,
  enroll,
  history,
}