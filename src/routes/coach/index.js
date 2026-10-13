'use strict'

const express = require('express')
const router = express.Router()

const coachController = require('../../controllers/coach.controller')
const courseController = require('../../controllers/course.controller')
const assignmentController = require('../../controllers/assignment.controller')
const learningController = require('../../controllers/learning.controller')
const masterDataController = require('../../controllers/masterData.controller')
const { auth } = require('../../middleware/auth')
const { ROLES } = require('../../config/constants')

const coachOnly = auth([ROLES.COACH])

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

// ─── Coach Dashboard & Stats ──────────────────────────────────────────────────
router.get('/stats', coachOnly, h(coachController.stats))
router.get('/students', coachOnly, h(coachController.students))
router.get('/earnings', coachOnly, h(coachController.earnings))

// ─── Coach Courses ────────────────────────────────────────────────────────────
router.post('/courses', coachOnly, h(courseController.createCourse))
router.get('/courses', coachOnly, h(courseController.coachCourses))
router.get('/courses/:id', coachOnly, h(courseController.coachCourseDetail))
router.put('/courses/:id', coachOnly, h(courseController.updateCoachCourse))
router.patch('/courses/:id', coachOnly, h(courseController.updateCoachCourse))

// ─── Coach Lessons ────────────────────────────────────────────────────────────
router.get('/lessons', coachOnly, h(learningController.listCoachLessons))
router.post('/lessons', coachOnly, h(learningController.createCoachLesson))
router.put('/lessons/:id', coachOnly, h(learningController.updateCoachLesson))
router.patch('/lessons/:id', coachOnly, h(learningController.updateCoachLesson))
router.delete('/lessons/:id', coachOnly, h(learningController.deleteCoachLesson))

// ─── Coach Topics ─────────────────────────────────────────────────────────────
router.get('/topics', coachOnly, h(learningController.listCoachTopics))
router.post('/topics', coachOnly, h(learningController.createCoachTopic))
router.put('/topics/:id', coachOnly, h(learningController.updateCoachTopic))
router.patch('/topics/:id', coachOnly, h(learningController.updateCoachTopic))
router.delete('/topics/:id', coachOnly, h(learningController.deleteCoachTopic))

// ─── Coach Quizzes ────────────────────────────────────────────────────────────
router.get('/quizzes', coachOnly, h(learningController.listCoachQuizzes))
router.get('/quizzes/:id', coachOnly, h(learningController.getCoachQuiz))
router.post('/quizzes', coachOnly, h(learningController.createCoachQuiz))
router.put('/quizzes/:id', coachOnly, h(learningController.updateCoachQuiz))
router.patch('/quizzes/:id', coachOnly, h(learningController.updateCoachQuiz))
router.delete('/quizzes/:id', coachOnly, h(learningController.deleteCoachQuiz))

// ─── Coach Assignments ────────────────────────────────────────────────────────
router.get('/assignments', coachOnly, h(assignmentController.list))
router.post('/assignments', coachOnly, h(assignmentController.create))
router.put('/assignments/:id', coachOnly, h(assignmentController.update))
router.patch('/assignments/:id', coachOnly, h(assignmentController.update))
router.delete('/assignments/:id', coachOnly, h(assignmentController.remove))
router.patch('/assignments/submissions/:id/review', coachOnly, h(assignmentController.reviewSubmission))

// ─── Coach Materials & Pricing Plans ──────────────────────────────────────────
router.get('/materials', coachOnly, h(learningController.listCoachMaterials))
router.post('/materials', coachOnly, h(learningController.createCoachMaterial))
router.delete('/materials/:id', coachOnly, h(learningController.deleteCoachMaterial))

router.get('/pricing-plans', coachOnly, h(learningController.listPricingPlans))
router.post('/pricing-plans', coachOnly, h(learningController.createPricingPlan))
router.put('/pricing-plans/:id', coachOnly, h(learningController.updatePricingPlan))
router.patch('/pricing-plans/:id', coachOnly, h(learningController.updatePricingPlan))
router.delete('/pricing-plans/:id', coachOnly, h(learningController.deletePricingPlan))

// ─── Coach Master Data ────────────────────────────────────────────────────────
router.get('/master-data', coachOnly, h(masterDataController.list))
router.post('/master-data', coachOnly, h(masterDataController.create))

module.exports = router
