const NotificationService = require('../../services/notification/notification.service')
const { ok, created, fail } = require('../../utils/response')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.list = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const notifications = await NotificationService.listForUser(req.user.id, req.user.role)
  return ok(res, { notifications }, 'Notifications fetched successfully.')
}

exports.create = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.title || !req.body?.message) {
    return fail(res, 400, 'Title and message are required')
  }

  const notification = await NotificationService.create({
    senderId: req.user.id,
    type: req.body.type,
    recipientId: req.body.recipientId,
    recipientRole: req.body.recipientRole,
    title: req.body.title,
    message: req.body.message,
  })

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_NOTIFICATION',
    module: 'notifications',
    description: `Notification sent: '${notification.title}'`,
    status: 'success',
    metadata: {
      notificationId: notification.id,
      recipientId: req.body.recipientId,
      recipientRole: req.body.recipientRole,
    },
  })

  return created(res, { notification }, 'Notification created successfully.')
}

exports.markRead = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const result = await NotificationService.markAsRead(req.params.id, req.user.id)

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'MARK_NOTIFICATION_READ',
    module: 'notifications',
    description: `Notification ID ${req.params.id} marked as read`,
    status: 'success',
    metadata: { notificationId: req.params.id },
  })

  return ok(res, result, 'Notification marked as read.')
}

exports.markAllRead = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const result = await NotificationService.markAllAsRead(req.user.id, req.user.role)

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'MARK_ALL_NOTIFICATIONS_READ',
    module: 'notifications',
    description: 'All notifications marked as read',
    status: 'success',
    metadata: {},
  })

  return ok(res, result, 'All notifications marked as read.')
}