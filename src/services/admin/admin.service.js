'use strict'

const AdminDashboardService = require('./dashboard/adminDashboardService')
const AdminCoachService = require('./coaches/adminCoachService')
const AdminStudentService = require('./students/adminStudentService')
const AdminPaymentService = require('./payments/adminPaymentService')
const AdminSettingsService = require('./settings/adminSettingsService')

module.exports = {
  AdminDashboardService,
  AdminCoachService,
  AdminStudentService,
  AdminPaymentService,
  AdminSettingsService,
  // Backward compatibility forwarders
  getDashboardStats: AdminDashboardService.getDashboardStats,
  getReports: AdminDashboardService.getReports,
  getAllCoaches: AdminCoachService.getAllCoaches,
  createCoach: AdminCoachService.createCoach,
  getCoachById: AdminCoachService.getCoachById,
  updateCoach: AdminCoachService.updateCoach,
  deleteCoach: AdminCoachService.deleteCoach,
  updateCoachStatus: AdminCoachService.updateCoachStatus,
  getAllStudents: AdminStudentService.getAllStudents,
  createStudent: AdminStudentService.createStudent,
  getStudentById: AdminStudentService.getStudentById,
  updateStudent: AdminStudentService.updateStudent,
  deleteStudent: AdminStudentService.deleteStudent,
  updateStudentStatus: AdminStudentService.updateStudentStatus,
  getAllPayments: AdminPaymentService.getAllPayments,
  getPlatformSettings: AdminSettingsService.getPlatformSettings,
  updatePlatformSettings: AdminSettingsService.updatePlatformSettings,
  getSubscriptions: AdminSettingsService.getSubscriptions,
}
