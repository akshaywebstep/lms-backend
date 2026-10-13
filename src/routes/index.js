'use strict'

const express = require('express')
const router = express.Router()

const profileController = require('../controllers/profile.controller')
const paymentController = require('../controllers/payment.controller')
const notificationController = require('../controllers/notification.controller')
const searchController = require('../controllers/search.controller')
const resourceModel = require('../models/resource.model')
const { auth } = require('../middleware/auth')
const { ROLES } = require('../config/constants')
const { created } = require('../utils/response')

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

// ─── Profile Routes ───────────────────────────────────────────────────────────
router.get('/profile', auth(), h(profileController.getProfile))
router.put('/profile', auth(), h(profileController.updateProfile))
router.get('/admin/profile', auth([ROLES.ADMIN]), h(profileController.getProfile))
router.put('/admin/profile', auth([ROLES.ADMIN]), h(profileController.updateProfile))
router.get('/coach/profile', auth([ROLES.COACH]), h(profileController.getProfile))
router.put('/coach/profile', auth([ROLES.COACH]), h(profileController.updateProfile))
router.get('/student/profile', auth([ROLES.STUDENT]), h(profileController.getProfile))
router.put('/student/profile', auth([ROLES.STUDENT]), h(profileController.updateProfile))

// ─── Payment Routes ───────────────────────────────────────────────────────────
router.post('/payments/checkout', auth([ROLES.STUDENT]), h(paymentController.checkout))
router.post('/students/enrollment/checkout', auth([ROLES.STUDENT]), h(paymentController.checkout))
router.post('/payments/create-order', auth([ROLES.STUDENT]), h(paymentController.createOrder))
router.post('/payments/verify', auth([ROLES.STUDENT]), h(paymentController.verify))
router.post('/student/enroll', auth([ROLES.STUDENT]), h(paymentController.enroll))
router.get('/payments/history', auth(), h(paymentController.history))

// ─── Notification Routes ──────────────────────────────────────────────────────
router.get('/notifications', auth(), h(notificationController.list))
router.post('/notifications', auth(), h(notificationController.create))
router.patch('/notifications/:id/read', auth(), h(notificationController.markRead))

// ─── Search Routes ────────────────────────────────────────────────────────────
router.get('/search', auth(), h(searchController.run))
router.get('/admin/search', auth([ROLES.ADMIN]), h(searchController.run))
router.get('/coach/search', auth([ROLES.COACH]), h(searchController.run))
router.get('/student/search', auth([ROLES.STUDENT]), h(searchController.run))

// ─── Upload Routes ────────────────────────────────────────────────────────────
const createUpload = (fileType) => async (req, res, next) => {
  try {
    const material = await resourceModel.createMaterial(req.user.id, req.body, fileType)
    return created(res, { upload: material, material })
  } catch (err) {
    next(err)
  }
}
router.post('/upload/image', auth(), createUpload('image'))
router.post('/upload/video', auth(), createUpload('video'))
router.post('/upload/document', auth(), createUpload('document'))

// ─── Sub-routers (Synconode style mounting) ───────────────────────────────────
router.use('/auth', require('./auth'))
router.use('/admin', require('./admin'))
router.use('/coach', require('./coach'))
router.use('/student', require('./student'))

module.exports = router
