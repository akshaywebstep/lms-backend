'use strict'

const express = require('express')
const router = express.Router()

const adminController = require('../../controllers/admin.controller')
const courseController = require('../../controllers/course.controller')
const emailConfigController = require('../../controllers/emailConfig.controller')
const masterDataController = require('../../controllers/masterData.controller')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const adminOnly = auth([ROLES.ADMIN])

// Wrap existing handlers uniformly for express
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

// ─── Admin Dashboard & Management ─────────────────────────────────────────────
router.get('/stats', adminOnly, h(adminController.stats))
router.get('/coaches', adminOnly, h(adminController.coaches))
router.post('/coaches', adminOnly, h(adminController.createCoach))
router.get('/coaches/:id', adminOnly, h(adminController.coachDetail))
router.patch('/coaches/:id/status', adminOnly, h(adminController.updateCoachStatus))

router.get('/students', adminOnly, h(adminController.students))
router.get('/students/:id', adminOnly, h(adminController.studentDetail))
router.patch('/students/:id/status', adminOnly, h(adminController.updateStudentStatus))

router.get('/payments', adminOnly, h(adminController.payments))
router.get('/reports', adminOnly, h(adminController.reports))
router.get('/settings', adminOnly, h(adminController.getPlatformSettings))
router.put('/settings', adminOnly, h(adminController.updatePlatformSettings))

// ─── Admin Courses ────────────────────────────────────────────────────────────
router.get('/courses', adminOnly, h(courseController.allCourses))
router.get('/courses/:id', adminOnly, h(courseController.adminCourseDetail))
router.put('/courses/:id', adminOnly, h(courseController.updateAdminCourse))
router.patch('/courses/:id', adminOnly, h(courseController.updateAdminCourse))

// ─── Admin Email Templates ────────────────────────────────────────────────────
router.get('/email-templates', adminOnly, h(emailConfigController.list))
router.get('/email-templates/:id', adminOnly, h(emailConfigController.get))
router.put('/email-templates/:id', adminOnly, h(emailConfigController.update))
router.post('/email-templates/:id/preview', adminOnly, h(emailConfigController.preview))
router.post('/email-templates/:id/test-send', adminOnly, h(emailConfigController.testSend))
router.post('/email-templates/sync', adminOnly, h(emailConfigController.sync))

// ─── Admin Master Data ────────────────────────────────────────────────────────
router.get('/master-data', adminOnly, h(masterDataController.list))
router.post('/master-data', adminOnly, h(masterDataController.create))
router.put('/master-data/:id', adminOnly, h(masterDataController.update))
router.delete('/master-data/:id', adminOnly, h(masterDataController.remove))

module.exports = router
