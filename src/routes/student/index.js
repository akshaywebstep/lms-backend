'use strict'

const express = require('express')
const router = express.Router()

const studentController = require('../../controllers/student.controller')
const courseController = require('../../controllers/course.controller')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const studentOnly = auth([ROLES.STUDENT])

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

// ─── Student Learning & Dashboard ─────────────────────────────────────────────
router.get('/dashboard', studentOnly, h(studentController.dashboard))
router.get('/courses', studentOnly, h(studentController.myCourses))
router.get('/courses/browse', studentOnly, h(courseController.browseCourses))
router.get('/courses/:id/learn', studentOnly, h(studentController.learnCourse))
router.post('/courses/:id/enroll', studentOnly, h(studentController.enroll))

router.patch('/lessons/:id/progress', studentOnly, h(studentController.updateProgress))
router.get('/quizzes/:id', studentOnly, h(studentController.getQuiz))
router.post('/quizzes/:id/submit', studentOnly, h(studentController.submitQuiz))
router.post('/assignments/:id/submit', studentOnly, h(studentController.submitAssignment))

router.get('/certificates', studentOnly, h(studentController.certificates))
router.get('/progress', studentOnly, h(studentController.progress))

module.exports = router
