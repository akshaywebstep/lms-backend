
const dashboardController = require('./dashboard/dashboardController')
const coachController = require('./coaches/coachController')
const studentController = require('./students/studentController')
const paymentController = require('./payments/paymentController')
const settingsController = require('./settings/settingsController')

// Dashboard
exports.stats = dashboardController.stats
exports.reports = dashboardController.reports

// Coaches
exports.coaches = coachController.coaches
exports.createCoach = coachController.createCoach
exports.coachDetail = coachController.coachDetail
exports.updateCoach = coachController.updateCoach
exports.deleteCoach = coachController.deleteCoach
exports.updateCoachStatus = coachController.updateCoachStatus

// Students
exports.students = studentController.students
exports.createStudent = studentController.createStudent
exports.studentDetail = studentController.studentDetail
exports.updateStudent = studentController.updateStudent
exports.deleteStudent = studentController.deleteStudent
exports.updateStudentStatus = studentController.updateStudentStatus

// Payments
exports.payments = paymentController.payments

// Settings & System
exports.getPlatformSettings = settingsController.getPlatformSettings
exports.updatePlatformSettings = settingsController.updatePlatformSettings
exports.subscriptions = settingsController.subscriptions
exports.blockUser = settingsController.blockUser
exports.unblockUser = settingsController.unblockUser
