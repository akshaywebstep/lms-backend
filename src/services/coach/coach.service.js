'use strict'

const CoachDashboardService = require('./dashboard/coachDashboardService')
const CoachStudentService = require('./students/coachStudentService')
const CoachEarningsService = require('./earnings/coachEarningsService')

module.exports = {
  CoachDashboardService,
  CoachStudentService,
  CoachEarningsService,
  // Backward compatibility forwarders
  getCoachStats: CoachDashboardService.getCoachStats,
  getCoachStudents: CoachStudentService.getCoachStudents,
  getCoachEarnings: CoachEarningsService.getCoachEarnings,
}
