const { logActivity } = require('../services/activity/activityLogService')

/**
 * Global Activity Logger Middleware
 * Automatically records all API interactions across Coach, Student, Admin, and Public flows.
 *
 * For new modules:
 * - ZERO CONFIG NEEDED: Automatically extracts the module name from the URL path:
 *   - /api/admin/<new-module>  -> module: '<new-module>'
 *   - /api/coach/<new-module>  -> module: '<new-module>'
 *   - /api/student/<new-module>-> module: '<new-module>'
 *   - /api/<new-module>        -> module: '<new-module>'
 *
 * - OPTIONAL CUSTOMIZATION: Any controller can optionally set:
 *   - req.activityModule = 'customName'
 *   - req.activityAction = 'CUSTOM_ACTION'
 *   - req.activityDescription = 'Custom message'
 */
exports.activityLogMiddleware = (req, res, next) => {
  // Ignore preflight options, health check, and viewing logs itself (to avoid infinite recursion)
  const path = req.originalUrl || req.path || ''
  if (
    req.method === 'OPTIONS' ||
    path.includes('/health') ||
    path.includes('/activity-logs') ||
    path.startsWith('/uploads')
  ) {
    return next()
  }

  const startTime = Date.now()

  res.on('finish', async () => {
    try {
      // If a controller already created a rich specific activity log for this request, skip auto-log
      if (req._activityLogged) {
        return
      }

      // 1. Dynamic Module Extraction from URL path
      // Strip '/api/' and query params: '/api/admin/webinars?sort=desc' -> 'admin/webinars'
      const cleanPath = path.replace(/^\/?api\/?/i, '').split('?')[0]
      const segments = cleanPath.split('/').filter(Boolean)

      let detectedModule = 'general'
      if (req.activityModule) {
        detectedModule = req.activityModule
      } else if (['admin', 'coach', 'student'].includes(segments[0]) && segments.length > 1) {
        // e.g. /api/admin/coaches -> 'coaches', /api/coach/live-classes -> 'live-classes'
        detectedModule = segments[1].toLowerCase()
      } else if (segments.length > 0) {
        // e.g. /api/auth/login -> 'auth', /api/notifications -> 'notifications'
        detectedModule = segments[0].toLowerCase()
      }

      // 2. Action Name
      const action = req.activityAction || `${req.method}_${detectedModule.toUpperCase()}`

      // 3. User Role
      const role =
        req.user?.role ||
        (segments[0] === 'admin'
          ? 'admin'
          : segments[0] === 'coach'
          ? 'coach'
          : segments[0] === 'student'
          ? 'student'
          : 'guest')

      const userName = req.user?.name || req.user?.email || 'User'
      const status = res.statusCode < 400 ? 'success' : res.statusCode < 500 ? 'warning' : 'failed'
      const durationMs = Date.now() - startTime

      const description =
        req.activityDescription ||
        `${role.toUpperCase()}: ${userName} called ${req.method} /${cleanPath} (${res.statusCode}) [${durationMs}ms]`

      await logActivity({
        req,
        userId: req.user?.id || null,
        role,
        action,
        module: detectedModule,
        description,
        status,
        metadata: {
          method: req.method,
          url: path,
          statusCode: res.statusCode,
          durationMs,
          params: req.params,
        },
      })
    } catch (err) {
      // Non-blocking: never crash response stream
      console.error('❌ Auto Activity Log Error:', err.message)
    }
  })

  next()
}
