const express = require('express')
const router = express.Router()

const authController = require('../../controllers/auth/authController')
const adminAuthController = require('../../controllers/auth/adminAuthController')
const coachAuthController = require('../../controllers/auth/coachAuthController')
const studentAuthController = require('../../controllers/auth/studentAuthController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

// ─── Role-Specific Auth Routes ────────────────────────────────────────────────
// Admin Auth
router.post('/admin/login', adminAuthController.login)
router.get('/admin/me', auth([ROLES.ADMIN, ROLES.SUPER_ADMIN]), adminAuthController.me)

// Coach Auth
router.post('/coach/login', coachAuthController.login)
router.post('/coach/register', coachAuthController.register)
router.get('/coach/me', auth([ROLES.COACH]), coachAuthController.me)

// Student Auth
router.post('/student/login', studentAuthController.login)
router.post('/student/register', studentAuthController.register)
router.get('/student/me', auth([ROLES.STUDENT]), studentAuthController.me)

// ─── Common Auth Utilities & Tokens ───────────────────────────────────────────
router.get('/verify', auth(), authController.verifyToken)
router.post('/verify-email', authController.verifyEmail)
router.post('/refresh-token', authController.refreshToken)
router.post('/logout', auth(), authController.logout)

// Password Recovery
router.post('/forgot-password', authController.forgotPassword)
router.post('/request-password-otp', authController.requestPasswordOtp)
router.post('/reset-password', authController.resetPassword)
router.post('/change-password', auth(), authController.changePassword)
router.post('/change-password-with-otp', authController.changePasswordWithOtp)

module.exports = router
