
const dashboardController = require('./dashboard/dashboardController')
const studentController = require('./students/studentController')
const earningsController = require('./earnings/earningsController')

exports.stats = dashboardController.stats
exports.students = studentController.students
exports.studentProgress = studentController.studentProgress
exports.earnings = earningsController.earnings
