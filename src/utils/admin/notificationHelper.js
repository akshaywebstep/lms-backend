'use strict'

const { Notification } = require('../../models')
const { makeId } = require('../id')

/**
 * Create admin notification helper (synconode pattern)
 */
exports.createNotification = async (req, title, description, category = 'System', scope = 'global') => {
  try {
    const senderId = req?.user?.id || req?.admin?.id || null
    await Notification.create({
      id: makeId('notif'),
      type: category.toLowerCase(),
      sender_id: senderId,
      recipient_role: 'admin',
      title,
      message: description,
      is_read: false,
    })
    return { status: true, message: 'Notification created successfully' }
  } catch (err) {
    console.error('Error creating notification:', err.message)
    return { status: false, message: err.message }
  }
}
