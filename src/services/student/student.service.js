'use strict'

const StudentDashboardService = require('./dashboard/studentDashboardService')
const StudentCourseService = require('./courses/studentCourseService')
const StudentCertificateService = require('./certificates/studentCertificateService')

module.exports = {
  StudentDashboardService,
  StudentCourseService,
  StudentCertificateService,
  // Backward compatibility forwarders
  getStudentDashboard: StudentDashboardService.getStudentDashboard,
  getStudentCourses: StudentCourseService.getStudentCourses,
  getStudentCertificates: StudentCertificateService.getStudentCertificates,
}
