'use strict'

const express = require('express')
const router = express.Router()

const studentController = require('../../controllers/student/studentController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const studentOnly = auth([ROLES.STUDENT])

// ─── Dashboard, Courses & Certificates ────────────────────────────────────────
router.get('/dashboard', studentOnly, studentController.dashboard)
router.get('/courses', studentOnly, studentController.myCourses)
router.get('/certificates', studentOnly, studentController.certificates)

module.exports = router
