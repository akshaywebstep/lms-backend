'use strict'

const express = require('express')
const router = express.Router()

const coachController = require('../../controllers/coach/coachController')
const courseController = require('../../controllers/course/courseController')
const learningController = require('../../controllers/learning/learningController')
const assignmentController = require('../../controllers/learning/assignmentController')
const masterDataController = require('../../controllers/masterData/masterDataController')
const profileController = require('../../controllers/profile/profileController')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const coachOnly = auth([ROLES.COACH])

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

// ─── Dashboard Stats, Students & Earnings ─────────────────────────────────────
router.get('/stats', coachOnly, coachController.stats)
router.get('/students', coachOnly, coachController.students)
router.get('/earnings', coachOnly, coachController.earnings)
router.get('/profile', coachOnly, h(profileController.getProfile))
router.put('/profile', coachOnly, h(profileController.updateProfile))

// ─── Courses CRUD ─────────────────────────────────────────────────────────────
router.get('/courses', coachOnly, h(courseController.coachCourses))
router.post('/courses', coachOnly, h(courseController.createCourse))
router.get('/courses/:id', coachOnly, h(courseController.coachCourseDetail))
router.put('/courses/:id', coachOnly, h(courseController.updateCoachCourse))
router.patch('/courses/:id', coachOnly, h(courseController.updateCoachCourse))

// ─── Lessons CRUD ─────────────────────────────────────────────────────────────
router.get('/lessons', coachOnly, h(learningController.listCoachLessons))
router.post('/lessons', coachOnly, h(learningController.createCoachLesson))
router.put('/lessons/:id', coachOnly, h(learningController.updateCoachLesson))
router.patch('/lessons/:id', coachOnly, h(learningController.updateCoachLesson))
router.delete('/lessons/:id', coachOnly, h(learningController.deleteCoachLesson))

// ─── Topics CRUD ──────────────────────────────────────────────────────────────
router.get('/topics', coachOnly, h(learningController.listCoachTopics))
router.post('/topics', coachOnly, h(learningController.createCoachTopic))
router.put('/topics/:id', coachOnly, h(learningController.updateCoachTopic))
router.patch('/topics/:id', coachOnly, h(learningController.updateCoachTopic))
router.delete('/topics/:id', coachOnly, h(learningController.deleteCoachTopic))

// ─── Quizzes CRUD ─────────────────────────────────────────────────────────────
router.get('/quizzes', coachOnly, h(learningController.listCoachQuizzes))
router.post('/quizzes', coachOnly, h(learningController.createCoachQuiz))
router.get('/quizzes/:id', coachOnly, h(learningController.getCoachQuiz))
router.put('/quizzes/:id', coachOnly, h(learningController.updateCoachQuiz))
router.patch('/quizzes/:id', coachOnly, h(learningController.updateCoachQuiz))
router.delete('/quizzes/:id', coachOnly, h(learningController.deleteCoachQuiz))

// ─── Assignments CRUD & Review ────────────────────────────────────────────────
router.get('/assignments', coachOnly, h(assignmentController.list))
router.post('/assignments', coachOnly, h(assignmentController.create))
router.put('/assignments/:id', coachOnly, h(assignmentController.update))
router.patch('/assignments/:id', coachOnly, h(assignmentController.update))
router.delete('/assignments/:id', coachOnly, h(assignmentController.remove))
router.patch('/assignments/submissions/:id/review', coachOnly, h(assignmentController.reviewSubmission))

// ─── Materials ────────────────────────────────────────────────────────────────
router.get('/materials', coachOnly, h(learningController.listCoachMaterials))
router.post('/materials', coachOnly, h(learningController.createCoachMaterial))
router.delete('/materials/:id', coachOnly, h(learningController.deleteCoachMaterial))

// ─── Pricing Plans ────────────────────────────────────────────────────────────
router.get('/pricing-plans', coachOnly, h(learningController.listPricingPlans))
router.post('/pricing-plans', coachOnly, h(learningController.createPricingPlan))
router.put('/pricing-plans/:id', coachOnly, h(learningController.updatePricingPlan))
router.patch('/pricing-plans/:id', coachOnly, h(learningController.updatePricingPlan))
router.delete('/pricing-plans/:id', coachOnly, h(learningController.deletePricingPlan))

// ─── Categories (Coach Custom) ────────────────────────────────────────────────
router.post('/categories', coachOnly, h(masterDataController.createCoachCategory))

module.exports = router
