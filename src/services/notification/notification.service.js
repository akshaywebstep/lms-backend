'use strict'

const { Notification, User } = require('../../models')
const { makeId } = require('../../utils/id')
const { Op } = require('sequelize')

class NotificationService {
  static async listForUser(userId, role) {
    const notifications = await Notification.findAll({
      where: {
        [Op.or]: [
          { recipient_id: userId },
          { recipient_role: role },
          { recipient_role: 'all' },
        ],
      },
      order: [['created_at', 'DESC']],
      limit: 50,
    })

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: Boolean(n.is_read),
      readAt: n.read_at,
      createdAt: n.created_at,
    }))
  }

  static async create({ type = 'general', senderId = null, recipientId = null, recipientRole = null, title, message }) {
    const id = makeId('notif')
    return Notification.create({
      id,
      type,
      sender_id: senderId,
      recipient_id: recipientId,
      recipient_role: recipientRole,
      title,
      message,
      is_read: false,
    })
  }

  static async markAsRead(id, userId) {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { id } }
    )
    return { success: true }
  }
}

module.exports = NotificationService
