'use strict'

const express = require('express')
const router = express.Router()

const adminController = require('../../controllers/admin/adminController')
const courseController = require('../../controllers/course.controller')
const masterDataController = require('../../controllers/masterData.controller')
const emailConfigController = require('../../controllers/emailConfig.controller')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const adminOnly = auth([ROLES.ADMIN, ROLES.SUPER_ADMIN])

// Adapter for ctx-style controllers
const h = (fn) => (req, res, next) => {
  const searchParams = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query || {})) {
    if (Array.isArray(v)) v.forEach((val) => searchParams.append(k, val))
    else if (v !== undefined) searchParams.set(k, String(v))
  }
  const ctx = {
    req,
    res,
    params: req.params,
    query: searchParams,
    body: req.body,
    user: req.user,
    tokenPayload: req.tokenPayload,
  }
  return fn(ctx).catch(next)
}

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
router.get('/courses', adminOnly, h(courseController.allCourses))
router.get('/courses/:id', adminOnly, h(courseController.adminCourseDetail))
router.put('/courses/:id', adminOnly, h(courseController.updateAdminCourse))
router.patch('/courses/:id', adminOnly, h(courseController.updateAdminCourse))

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
router.get('/master-data', adminOnly, h(masterDataController.listAdminAll))
router.get('/master-data/:type', adminOnly, h(masterDataController.listAdmin))
router.post('/master-data/:type', adminOnly, h(masterDataController.createAdmin))
router.put('/master-data/:type/:id', adminOnly, h(masterDataController.updateAdmin))
router.patch('/master-data/:type/:id', adminOnly, h(masterDataController.updateAdmin))
router.delete('/master-data/:type/:id', adminOnly, h(masterDataController.deleteAdmin))

// ─── Email Configs ────────────────────────────────────────────────────────────
router.get('/email-configs', adminOnly, h(emailConfigController.list))
router.get('/email-configs/:id', adminOnly, h(emailConfigController.getById))
router.put('/email-configs/:id', adminOnly, h(emailConfigController.update))
router.post('/email-configs/:id/test-send', adminOnly, h(emailConfigController.testSend))

module.exports = router
