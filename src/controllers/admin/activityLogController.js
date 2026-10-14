const activityLogService = require('../../services/activity/activityLogService')

/**
 * GET /api/admin/activity-logs
 * List all activity logs with filtering and pagination
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { page, limit, role, module: mod, action, userId, status, search, fromDate, toDate } = req.query

    const result = await activityLogService.getActivityLogs({
      page,
      limit,
      role,
      module: mod,
      action,
      userId,
      status,
      search,
      fromDate,
      toDate,
    })

    if (!result.status) {
      return res.status(500).json({
        status: false,
        success: false,
        message: result.message || 'Failed to fetch activity logs.',
        data: null,
      })
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Activity logs fetched successfully.',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in getActivityLogs controller:', error)
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Internal server error: ' + error.message,
      data: null,
    })
  }
}
