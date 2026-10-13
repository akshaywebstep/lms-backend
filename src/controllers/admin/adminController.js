'use strict'

const dashboardController = require('./dashboard/dashboardController')
const coachController = require('./coaches/coachController')
const studentController = require('./students/studentController')
const paymentController = require('./payments/paymentController')
const settingsController = require('./settings/settingsController')

module.exports = {
  // Dashboard
  stats: dashboardController.stats,
  reports: dashboardController.reports,

  // Coaches
  coaches: coachController.coaches,
  createCoach: coachController.createCoach,
  coachDetail: coachController.coachDetail,
  updateCoach: coachController.updateCoach,
  deleteCoach: coachController.deleteCoach,
  updateCoachStatus: coachController.updateCoachStatus,

  // Students
  students: studentController.students,
  createStudent: studentController.createStudent,
  studentDetail: studentController.studentDetail,
  updateStudent: studentController.updateStudent,
  deleteStudent: studentController.deleteStudent,
  updateStudentStatus: studentController.updateStudentStatus,

  // Payments
  payments: paymentController.payments,

  // Settings & System
  getPlatformSettings: settingsController.getPlatformSettings,
  updatePlatformSettings: settingsController.updatePlatformSettings,
  subscriptions: settingsController.subscriptions,
  blockUser: settingsController.blockUser,
  unblockUser: settingsController.unblockUser,
}
