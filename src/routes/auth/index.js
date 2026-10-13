'use strict'

const express = require('express')
const router = express.Router()

const authController = require('../../controllers/auth/authController')
const { auth } = require('../../middleware/auth')

router.post('/login', (req, res) => authController.login({ req, res, body: req.body }))
router.post('/register', (req, res) => authController.register({ req, res, body: req.body }))
router.get('/me', auth(), (req, res) => authController.me({ req, res, user: req.user }))
router.get('/verify', auth(), (req, res) => authController.verifyToken({ req, res, user: req.user }))
router.post('/verify-email', (req, res) => authController.verifyEmail({ req, res, body: req.body, query: req.query }))
router.post('/refresh-token', (req, res) => authController.refreshToken({ req, res, body: req.body }))
router.post('/logout', auth(), (req, res) => authController.logout({ req, res, user: req.user, tokenPayload: req.tokenPayload, body: req.body }))

router.post('/forgot-password', (req, res) => authController.forgotPassword({ req, res, body: req.body }))
router.post('/request-password-otp', (req, res) => authController.requestPasswordOtp({ req, res, body: req.body }))
router.post('/reset-password', (req, res) => authController.resetPassword({ req, res, body: req.body }))
router.post('/change-password', auth(), (req, res) => authController.changePassword({ req, res, user: req.user, body: req.body }))
router.post('/change-password-with-otp', (req, res) => authController.changePasswordWithOtp({ req, res, body: req.body }))

module.exports = router
