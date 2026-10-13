'use strict'

const express = require('express')
const router = express.Router()

const profileController = require('../controllers/profile/profileController')
const paymentController = require('../controllers/payment/paymentController')
const notificationController = require('../controllers/notification/notificationController')
const searchController = require('../controllers/search/searchController')
const masterDataController = require('../controllers/masterData/masterDataController')
const emailConfigController = require('../controllers/admin/settings/emailConfigController')
const { Upload } = require('../models')
const { makeId } = require('../utils/id')
const { saveUploadedFile, typeFromMime } = require('../services/upload')
const { auth } = require('../middleware/auth')
const { ROLES } = require('../config/constants')
const { created, ok, fail } = require('../utils/response')

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

// ─── Master Data (Public) ─────────────────────────────────────────────────────
router.get('/master-data', auth(), h(masterDataController.listPublic))

// ─── Email Templates (CRUD Accessible by Admin & Staff) ───────────────────────
const staffOnly = auth([ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.COACH])
const adminOnly = auth([ROLES.ADMIN, ROLES.SUPER_ADMIN])
router.get('/email-templates', staffOnly, h(emailConfigController.list))
router.get('/email-templates/:id', staffOnly, h(emailConfigController.getById))
router.post('/email-templates', adminOnly, h(emailConfigController.create))
router.put('/email-templates/:id', staffOnly, h(emailConfigController.update))
router.post('/email-templates/:id/reset', staffOnly, h(emailConfigController.reset))
router.delete('/email-templates/:id', adminOnly, h(emailConfigController.remove))
router.post('/email-templates/:id/test-send', staffOnly, h(emailConfigController.testSend))

// ─── Upload Routes ────────────────────────────────────────────────────────────
const createUpload = (fileType) => async (req, res, next) => {
  try {
    const file = req.body?.files?.[0]
    const uploaded = file ? saveUploadedFile(file) : null
    const inferredType = uploaded ? uploaded.type : fileType || typeFromMime(req.body?.mimeType || '')
    const originalName = uploaded?.originalName || req.body?.originalName || `${fileType}_file`
    const backendBase = (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '')
    const fileUrl = uploaded ? `${backendBase}${uploaded.url}` : (req.body?.fileUrl || req.body?.url || '')
    const mimeType = uploaded?.mimeType || req.body?.mimeType || 'application/octet-stream'
    const sizeBytes = uploaded?.sizeBytes || req.body?.sizeBytes || 0

    const upload = await Upload.create({
      id: makeId('up'),
      owner_id: req.user.id,
      file_type: inferredType,
      original_name: originalName,
      file_url: fileUrl,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    })

    const payload = {
      id: upload.id,
      ownerId: upload.owner_id,
      type: upload.file_type,
      name: upload.original_name,
      url: fileUrl,
      fileUrl: fileUrl,
      mimeType: upload.mime_type,
      sizeBytes: upload.size_bytes,
      createdAt: upload.createdAt,
    }
    return created(res, { upload: payload, material: payload, url: fileUrl })
  } catch (err) {
    next(err)
  }
}
router.post('/upload/image', auth(), createUpload('image'))
router.post('/upload/video', auth(), createUpload('video'))
router.post('/upload/document', auth(), createUpload('document'))

// ─── Sub-routers (Synconode standard domain routers) ──────────────────────────
router.use('/auth', require('./auth'))
router.use('/admin', require('./admin'))
router.use('/coach', require('./coach'))
router.use('/student', require('./student'))

module.exports = router
