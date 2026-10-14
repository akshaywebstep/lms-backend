
const dashboardController = require('./dashboard/dashboardController')
const courseController = require('./courses/courseController')
const certificateController = require('./certificates/certificateController')

exports.dashboard = dashboardController.dashboard
exports.myCourses = courseController.myCourses
exports.certificates = certificateController.certificates
