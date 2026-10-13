'use strict'

const { Notification } = require('../../models')
const { makeId } = require('../id')

/**
 * Log activity helper (synconode pattern)
 */
exports.logActivity = async (req, panel, module, action, data, status) => {
  try {
    const adminId = req?.user?.id || req?.admin?.id || 'system'
    // Log in console for audit trail
    console.log(`[ACTIVITY LOG] [${panel.toUpperCase()}][${module}][${action}] User: ${adminId} Status: ${status ? 'SUCCESS' : 'FAILED'}`)
    return { status: true }
  } catch (err) {
    return { status: false, message: err.message }
  }
}
