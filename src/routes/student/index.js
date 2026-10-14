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

// ─── Dashboard Stats & Profile ────────────────────────────────────────────────
router.get('/stats', studentOnly, studentController.dashboard)
router.get('/dashboard', studentOnly, studentController.dashboard)
router.get('/profile', studentOnly, profileController.getProfile)
router.put('/profile', studentOnly, profileController.updateProfile)

// ─── Courses & Browsing ───────────────────────────────────────────────────────
router.get('/courses/browse', studentOnly, courseController.browseCourses)
router.get('/courses/enrolled', studentOnly, studentController.myCourses)
router.get('/courses', studentOnly, studentController.myCourses)
router.get('/courses/:courseId/content', studentOnly, learningController.studentCourseContent)

// ─── Progress & Enroll ────────────────────────────────────────────────────────
router.post('/enroll', studentOnly, paymentController.enroll)
router.get('/progress', studentOnly, studentController.dashboard)
router.patch('/lessons/:id/progress', studentOnly, learningController.updateStudentLessonProgress)
router.post('/lessons/:id/progress', studentOnly, learningController.updateStudentLessonProgress)

// ─── Quizzes & Assignments & Certificates ─────────────────────────────────────
router.get('/quizzes', studentOnly, learningController.listStudentQuizzes)
router.post('/quizzes/:id/attempts', studentOnly, learningController.attemptStudentQuiz)

router.get('/assignments', studentOnly, learningController.listStudentAssignments)
router.post('/assignments/:id/submit', studentOnly, learningController.submitStudentAssignment)

router.get('/certificates', studentOnly, learningController.listStudentCertificates)

module.exports = router
