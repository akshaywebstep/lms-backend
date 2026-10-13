'use strict'

const AdminSettingsService = require('../../../services/admin/settings/adminSettingsService')
const AdminCoachService = require('../../../services/admin/coaches/adminCoachService')

/**
 * 1. Get Platform Settings
 * GET /api/admin/settings
 */
exports.getPlatformSettings = async (req, res) => {
  try {
    const result = await AdminSettingsService.getPlatformSettings()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in getPlatformSettings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 2. Update Platform Settings
 * PUT /api/admin/settings
 */
exports.updatePlatformSettings = async (req, res) => {
  try {
    const result = await AdminSettingsService.updatePlatformSettings(req.body)
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    console.error('❌ Error in updatePlatformSettings controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message })
  }
}

/**
 * 3. Subscriptions (Pricing plans)
 * GET /api/admin/subscriptions
 */
exports.subscriptions = async (req, res) => {
  try {
    const result = await AdminSettingsService.getSubscriptions()
    return res.status(result.status ? 200 : 500).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
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
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' })
    const result = await AdminCoachService.updateCoachStatus(userId, 'blocked')
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
  }
}

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' })
    const result = await AdminCoachService.updateCoachStatus(userId, 'active')
    return res.status(result.status ? 200 : 400).json(result.status ? result.data : result)
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message })
  }
}
