'use strict'

const express = require('express')
const router = express.Router()

const adminController = require('../../controllers/admin/adminController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const adminOnly = auth([ROLES.ADMIN])

// ─── Dashboard Stats & Users ──────────────────────────────────────────────────
router.get('/stats', adminOnly, adminController.stats)
router.get('/coaches', adminOnly, adminController.coaches)
router.post('/coaches', adminOnly, adminController.createCoach)
router.get('/coaches/:id', adminOnly, adminController.coachDetail)
router.patch('/coaches/:id/status', adminOnly, adminController.updateCoachStatus)

router.get('/students', adminOnly, adminController.students)
router.get('/students/:id', adminOnly, adminController.studentDetail)
router.patch('/students/:id/status', adminOnly, adminController.updateStudentStatus)

// ─── Payments & Platform Settings ─────────────────────────────────────────────
router.get('/payments', adminOnly, adminController.payments)
router.get('/settings', adminOnly, adminController.getPlatformSettings)
router.put('/settings', adminOnly, adminController.updatePlatformSettings)

module.exports = router
