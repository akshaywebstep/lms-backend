
const { PlatformSetting } = require('../../../models')
const { Op } = require('sequelize')

exports.getPlatformSettings = async () => {
  try {
    const rows = await PlatformSetting.findAll()
    const settings = {}
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value
    })
    return {
      status: true,
      message: 'Platform settings fetched successfully.',
      data: { settings },
    }
  } catch (error) {
    console.error('❌ Error in AdminSettingsService.getPlatformSettings:', error)
    return { status: false, message: error.message, data: null }
  }
}

exports.updatePlatformSettings = async (body) => {
  try {
    for (const [key, val] of Object.entries(body || {})) {
      await PlatformSetting.upsert({ setting_key: key, setting_value: val })
    }
    return exports.getPlatformSettings()
  } catch (error) {
    console.error('❌ Error in AdminSettingsService.updatePlatformSettings:', error)
    return { status: false, message: error.message, data: null }
  }
}

exports.getSubscriptions = async () => {
  try {
    const rows = await PlatformSetting.findAll({
      where: { setting_key: { [Op.like]: 'pricing_plans:%' } },
    })
    const plans = rows.flatMap((row) => {
      const coachId = row.setting_key.replace('pricing_plans:', '')
      const list = Array.isArray(row.setting_value) ? row.setting_value : []
      return list.map((plan) => ({ ...plan, coachId }))
    })
    return {
      status: true,
      message: 'Subscriptions fetched successfully.',
      data: { subscriptions: plans, plans, total: plans.length },
    }
  } catch (error) {
    return { status: false, message: error.message, data: null }
  }
}
