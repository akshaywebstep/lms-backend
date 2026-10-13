'use strict'

const NotificationService = require('../services/notification/notification.service')
const { ok, created, fail } = require('../utils/response')

const list = async (ctx) => {
  const notifications = await NotificationService.listForUser(ctx.user.id, ctx.user.role)
  return ok(ctx.res, { notifications })
}

const create = async (ctx) => {
  if (!ctx.body.title || !ctx.body.message) return fail(ctx.res, 400, 'Title and message are required')
  const notification = await NotificationService.create({
    senderId: ctx.user.id,
    type: ctx.body.type,
    recipientId: ctx.body.recipientId,
    recipientRole: ctx.body.recipientRole,
    title: ctx.body.title,
    message: ctx.body.message,
  })
  return created(ctx.res, { notification })
}

const markRead = async (ctx) => {
  const result = await NotificationService.markAsRead(ctx.params.id, ctx.user.id)
  return ok(ctx.res, result)
}

module.exports = {
  list,
  create,
  markRead,
}