'use strict'

const express = require('express')
const router = express.Router()

const studentController = require('../../controllers/student/studentController')
const courseController = require('../../controllers/course/courseController')
const learningController = require('../../controllers/learning/learningController')
const paymentController = require('../../controllers/payment/paymentController')
const profileController = require('../../controllers/profile/profileController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const studentOnly = auth([ROLES.STUDENT])

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

// ─── Dashboard Stats & Profile ────────────────────────────────────────────────
router.get('/stats', studentOnly, studentController.dashboard)
router.get('/dashboard', studentOnly, studentController.dashboard)
router.get('/profile', studentOnly, h(profileController.getProfile))
router.put('/profile', studentOnly, h(profileController.updateProfile))

// ─── Courses & Browsing ───────────────────────────────────────────────────────
router.get('/courses/browse', studentOnly, h(courseController.browseCourses))
router.get('/courses/enrolled', studentOnly, studentController.myCourses)
router.get('/courses', studentOnly, studentController.myCourses)
router.get('/courses/:courseId/content', studentOnly, h(learningController.studentCourseContent))

// ─── Progress & Enroll ────────────────────────────────────────────────────────
router.post('/enroll', studentOnly, h(paymentController.enroll))
router.get('/progress', studentOnly, studentController.dashboard)
router.patch('/lessons/:id/progress', studentOnly, h(learningController.updateStudentLessonProgress))
router.post('/lessons/:id/progress', studentOnly, h(learningController.updateStudentLessonProgress))

// ─── Quizzes & Assignments & Certificates ─────────────────────────────────────
router.get('/quizzes', studentOnly, h(learningController.listStudentQuizzes))
router.post('/quizzes/:id/attempts', studentOnly, h(learningController.attemptStudentQuiz))

router.get('/assignments', studentOnly, h(learningController.listStudentAssignments))
router.post('/assignments/:id/submit', studentOnly, h(learningController.submitStudentAssignment))

router.get('/certificates', studentOnly, h(learningController.listStudentCertificates))

module.exports = router
