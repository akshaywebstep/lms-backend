const AdminSettingsService = require('../../../services/admin/settings/adminSettingsService')
const AdminCoachService = require('../../../services/admin/coaches/adminCoachService')
const { logActivity } = require('../../../services/activity/activityLogService')

/**
 * 1. Get Platform Settings
 * GET /api/admin/settings
 */
exports.getPlatformSettings = async (req, res) => {
  try {
    const result = await AdminSettingsService.getPlatformSettings()
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    console.error('❌ Error in getPlatformSettings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 2. Update Platform Settings
 * PUT /api/admin/settings
 */
exports.updatePlatformSettings = async (req, res) => {
  try {
    const result = await AdminSettingsService.updatePlatformSettings(req.body)

    await logActivity({
      req,
      userId: req.user?.id || req.admin?.id,
      role: req.user?.role || 'admin',
      action: 'UPDATE_PLATFORM_SETTINGS',
      module: 'settings',
      description: 'Admin updated platform settings',
      status: result.status ? 'success' : 'failed',
      metadata: req.body,
    })

    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    console.error('❌ Error in updatePlatformSettings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 3. Subscriptions (Pricing plans)
 * GET /api/admin/subscriptions
 */
exports.subscriptions = async (req, res) => {
  try {
    const result = await AdminSettingsService.getSubscriptions()
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message, data: null })
  }
}

/**
 * 4. Block / Unblock User
 * POST /api/admin/users/block
 * POST /api/admin/users/unblock
 */
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ status: false, success: false, message: 'User ID is required', data: null })
    const result = await AdminCoachService.updateCoachStatus(userId, 'blocked')

    await logActivity({
      req,
      userId: req.user?.id || req.admin?.id,
      role: req.user?.role || 'admin',
      action: 'BLOCK_USER',
      module: 'users',
      description: `Admin blocked user ID ${userId}`,
      status: result.status ? 'success' : 'failed',
      metadata: { userId },
    })

    return res.status(result.status ? 200 : 400).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message, data: null })
  }
}

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ status: false, success: false, message: 'User ID is required', data: null })
    const result = await AdminCoachService.updateCoachStatus(userId, 'active')

    await logActivity({
      req,
      userId: req.user?.id || req.admin?.id,
      role: req.user?.role || 'admin',
      action: 'UNBLOCK_USER',
      module: 'users',
      description: `Admin unblocked user ID ${userId}`,
      status: result.status ? 'success' : 'failed',
      metadata: { userId },
    })

    return res.status(result.status ? 200 : 400).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message, data: null })
  }
}
