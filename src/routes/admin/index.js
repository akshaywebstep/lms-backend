const express = require('express')
const router = express.Router()

const adminController = require('../../controllers/admin/adminController')
const courseController = require('../../controllers/course/courseController')
const learningController = require('../../controllers/learning/learningController')
const masterDataController = require('../../controllers/masterData/masterDataController')
const emailConfigController = require('../../controllers/admin/settings/emailConfigController')
const activityLogController = require('../../controllers/admin/activityLogController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const adminOnly = auth([ROLES.ADMIN, ROLES.SUPER_ADMIN])

// ─── Dashboard Stats & Users ──────────────────────────────────────────────────
router.get('/stats', adminOnly, adminController.stats)
router.get('/coaches', adminOnly, adminController.coaches)
router.post('/coaches', adminOnly, adminController.createCoach)
router.get('/coaches/:id', adminOnly, adminController.coachDetail)
router.put('/coaches/:id', adminOnly, adminController.updateCoach)
router.patch('/coaches/:id', adminOnly, adminController.updateCoach)
router.delete('/coaches/:id', adminOnly, adminController.deleteCoach)
router.patch('/coaches/:id/status', adminOnly, adminController.updateCoachStatus)

router.get('/students', adminOnly, adminController.students)
router.post('/students', adminOnly, adminController.createStudent)
router.get('/students/:id', adminOnly, adminController.studentDetail)
router.put('/students/:id', adminOnly, adminController.updateStudent)
router.patch('/students/:id', adminOnly, adminController.updateStudent)
router.delete('/students/:id', adminOnly, adminController.deleteStudent)
router.patch('/students/:id/status', adminOnly, adminController.updateStudentStatus)

// ─── Courses Management ───────────────────────────────────────────────────────
router.get('/courses', adminOnly, courseController.allCourses)
router.get('/courses/:id', adminOnly, courseController.adminCourseDetail)
router.put('/courses/:id', adminOnly, courseController.updateAdminCourse)
router.patch('/courses/:id', adminOnly, courseController.updateAdminCourse)
router.get('/lessons/:id', adminOnly, learningController.getCoachLesson)

// ─── Payments & Reports ───────────────────────────────────────────────────────
router.get('/payments', adminOnly, adminController.payments)
router.get('/reports', adminOnly, adminController.reports)
router.get('/subscriptions', adminOnly, adminController.subscriptions)
router.post('/users/block', adminOnly, adminController.blockUser)
router.post('/users/unblock', adminOnly, adminController.unblockUser)

// ─── Platform Settings ────────────────────────────────────────────────────────
router.get('/settings', adminOnly, adminController.getPlatformSettings)
router.put('/settings', adminOnly, adminController.updatePlatformSettings)

// ─── Master Data ──────────────────────────────────────────────────────────────
router.get('/master-data', adminOnly, masterDataController.listAdminAll)
router.get('/master-data/:type', adminOnly, masterDataController.listAdmin)
router.post('/master-data/:type', adminOnly, masterDataController.createAdmin)
router.put('/master-data/:type/:id', adminOnly, masterDataController.updateAdmin)
router.patch('/master-data/:type/:id', adminOnly, masterDataController.updateAdmin)
router.delete('/master-data/:type/:id', adminOnly, masterDataController.deleteAdmin)

// ─── Email Configs ────────────────────────────────────────────────────────────
router.get('/email-configs', adminOnly, emailConfigController.list)
router.get('/email-configs/:id', adminOnly, emailConfigController.getById)
router.put('/email-configs/:id', adminOnly, emailConfigController.update)
router.post('/email-configs/:id/test-send', adminOnly, emailConfigController.testSend)

// ─── Activity Logs ────────────────────────────────────────────────────────────
router.get('/activity-logs', adminOnly, activityLogController.getActivityLogs)

module.exports = router
