'use strict'

const dashboardController = require('./dashboard/dashboardController')
const courseController = require('./courses/courseController')
const certificateController = require('./certificates/certificateController')

module.exports = {
  dashboard: dashboardController.dashboard,
  myCourses: courseController.myCourses,
  certificates: certificateController.certificates,
}
