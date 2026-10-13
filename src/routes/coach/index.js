'use strict'

const express = require('express')
const router = express.Router()

const coachController = require('../../controllers/coach/coachController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const coachOnly = auth([ROLES.COACH])

// ─── Dashboard Stats, Students & Earnings ─────────────────────────────────────
router.get('/stats', coachOnly, coachController.stats)
router.get('/students', coachOnly, coachController.students)
router.get('/earnings', coachOnly, coachController.earnings)

module.exports = router
