const { ActivityLog, User } = require('../../models')
const { makeId } = require('../../utils/id')
const { Op } = require('sequelize')

/**
 * Log activity in activity_logs table
 * @param {Object} options
 * @param {Object} [options.req] - Express request object (optional, auto-extracts IP, User-Agent, User)
 * @param {string} [options.userId] - User ID
 * @param {string} [options.role] - User role ('admin', 'superadmin', 'coach', 'student', 'system')
 * @param {string} options.action - Action performed (e.g. 'LOGIN', 'COURSE_CREATE', 'STATUS_CHANGE')
 * @param {string} [options.module] - Module name (e.g. 'auth', 'courses', 'students', 'coaches')
 * @param {string} [options.description] - Human-readable description
 * @param {string} [options.status='success'] - 'success' | 'failed' | 'warning'
 * @param {Object} [options.metadata] - Extra structured metadata / target ID / diff
 */
exports.logActivity = async ({
  req = null,
  userId = null,
  role = null,
  action,
  module: mod = null,
  description = null,
  status = 'success',
  metadata = null,
}) => {
  try {
    if (req) req._activityLogged = true
    const finalUserId = userId || req?.user?.id || req?.admin?.id || null
    const finalRole = role || req?.user?.role || req?.admin?.role || null
    const ipAddress =
      req?.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null
    const userAgent = req?.headers?.['user-agent'] || null

    const logEntry = await ActivityLog.create({
      id: makeId('act'),
      user_id: finalUserId,
      role: finalRole,
      action: action || 'UNKNOWN',
      module: mod || 'general',
      description: description || null,
      ip_address: ipAddress ? String(ipAddress).slice(0, 64) : null,
      user_agent: userAgent,
      status: status ? String(status).toLowerCase() : 'success',
      metadata: metadata || null,
    })

    return { status: true, data: logEntry }
  } catch (error) {
    console.error('❌ Error recording activity log:', error.message)
    // Non-blocking: never crash the parent flow if logging fails
    return { status: false, message: error.message }
  }
}

/**
 * Get paginated activity logs with filters (for Admin/Audit)
 */
exports.getActivityLogs = async ({
  page = 1,
  limit = 20,
  role = null,
  module: mod = null,
  action = null,
  userId = null,
  status = null,
  search = null,
  fromDate = null,
  toDate = null,
} = {}) => {
  try {
    const p = Math.max(1, Number(page) || 1)
    const l = Math.min(100, Math.max(1, Number(limit) || 20))
    const offset = (p - 1) * l

    const where = {}
    if (role) where.role = role
    if (mod) where.module = mod
    if (action) where.action = action
    if (userId) where.user_id = userId
    if (status) where.status = status

    if (fromDate || toDate) {
      where.created_at = {}
      if (fromDate) where.created_at[Op.gte] = new Date(fromDate)
      if (toDate) where.created_at[Op.lte] = new Date(toDate)
    }

    if (search) {
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { module: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ]
    }

    const { rows, count } = await ActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: l,
      offset,
    })

    const rawModules = await ActivityLog.findAll({
      attributes: [[ActivityLog.sequelize.fn('DISTINCT', ActivityLog.sequelize.col('module')), 'module']],
      raw: true,
    })
    const availableModules = rawModules.map((m) => m.module).filter(Boolean).sort()

    return {
      status: true,
      message: 'Activity logs fetched successfully.',
      data: {
        logs: rows,
        modules: availableModules,
        pagination: {
          total: count,
          page: p,
          limit: l,
          totalPages: Math.ceil(count / l),
        },
      },
    }
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error)
    return {
      status: false,
      message: error.message || 'Failed to fetch activity logs.',
      data: null,
    }
  }
}
