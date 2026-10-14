const activityLogService = require('../../services/activity/activityLogService')

/**
 * Log activity helper (saves to activity_logs table)
 * @param {Object} req - Express request
 * @param {string} panel - 'admin' | 'coach' | 'student' | 'system'
 * @param {string} moduleName - Module name (e.g. 'coaches', 'courses', 'students')
 * @param {string} action - Action (e.g. 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')
 * @param {Object} [data] - Target or metadata
 * @param {boolean} [status=true] - Success or failed
 */
exports.logActivity = async (req, panel, moduleName, action, data = null, status = true) => {
  try {
    const adminId = req?.user?.id || req?.admin?.id || null
    const role = req?.user?.role || panel || 'admin'
    const desc = typeof data === 'string' ? data : `${action} on ${moduleName}`

    return await activityLogService.logActivity({
      req,
      userId: adminId,
      role,
      action: action ? String(action).toUpperCase() : 'UNKNOWN',
      module: moduleName || 'general',
      description: desc,
      status: status ? 'success' : 'failed',
      metadata: typeof data === 'object' ? data : { note: data },
    })
  } catch (err) {
    console.error('❌ Error in activityLogger:', err.message)
    return { status: false, message: err.message }
  }
}
