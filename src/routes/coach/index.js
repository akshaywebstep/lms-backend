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

// ─── Dashboard Stats, Students & Earnings ─────────────────────────────────────
router.get('/stats', coachOnly, coachController.stats)
router.get('/students', coachOnly, coachController.students)
router.get('/students/:studentId/progress', coachOnly, coachController.studentProgress)
router.get('/students/:id/progress', coachOnly, coachController.studentProgress)
router.get('/earnings', coachOnly, coachController.earnings)
router.get('/profile', coachOnly, profileController.getProfile)
router.put('/profile', coachOnly, profileController.updateProfile)

// ─── Courses CRUD ─────────────────────────────────────────────────────────────
router.get('/courses', coachOnly, courseController.coachCourses)
router.post('/courses', coachOnly, courseController.createCourse)
router.get('/courses/:id', coachOnly, courseController.coachCourseDetail)
router.put('/courses/:id', coachOnly, courseController.updateCoachCourse)
router.patch('/courses/:id', coachOnly, courseController.updateCoachCourse)

// ─── Lessons CRUD ─────────────────────────────────────────────────────────────
router.get('/lessons', coachOnly, learningController.listCoachLessons)
router.get('/lessons/:id', coachOnly, learningController.getCoachLesson)
router.post('/lessons', coachOnly, learningController.createCoachLesson)
router.put('/lessons/:id', coachOnly, learningController.updateCoachLesson)
router.patch('/lessons/:id', coachOnly, learningController.updateCoachLesson)
router.delete('/lessons/:id', coachOnly, learningController.deleteCoachLesson)

// ─── Topics CRUD ──────────────────────────────────────────────────────────────
router.get('/topics', coachOnly, learningController.listCoachTopics)
router.post('/topics', coachOnly, learningController.createCoachTopic)
router.put('/topics/:id', coachOnly, learningController.updateCoachTopic)
router.patch('/topics/:id', coachOnly, learningController.updateCoachTopic)
router.delete('/topics/:id', coachOnly, learningController.deleteCoachTopic)

// ─── Quizzes CRUD ─────────────────────────────────────────────────────────────
router.get('/quizzes', coachOnly, learningController.listCoachQuizzes)
router.post('/quizzes', coachOnly, learningController.createCoachQuiz)
router.get('/quizzes/:id', coachOnly, learningController.getCoachQuiz)
router.put('/quizzes/:id', coachOnly, learningController.updateCoachQuiz)
router.patch('/quizzes/:id', coachOnly, learningController.updateCoachQuiz)
router.delete('/quizzes/:id', coachOnly, learningController.deleteCoachQuiz)

// ─── Assignments CRUD & Review ────────────────────────────────────────────────
router.get('/assignments', coachOnly, assignmentController.list)
router.post('/assignments', coachOnly, assignmentController.create)
router.put('/assignments/:id', coachOnly, assignmentController.update)
router.patch('/assignments/:id', coachOnly, assignmentController.update)
router.delete('/assignments/:id', coachOnly, assignmentController.remove)
router.patch('/assignments/submissions/:id/review', coachOnly, assignmentController.reviewSubmission)

// ─── Materials ────────────────────────────────────────────────────────────────
router.get('/materials', coachOnly, learningController.listCoachMaterials)
router.post('/materials', coachOnly, learningController.createCoachMaterial)
router.delete('/materials/:id', coachOnly, learningController.deleteCoachMaterial)

// ─── Categories (Coach Custom) ────────────────────────────────────────────────
router.post('/categories', coachOnly, masterDataController.createCoachCategory)

module.exports = router
