'use strict'

const dashboardController = require('./dashboard/dashboardController')
const studentController = require('./students/studentController')
const earningsController = require('./earnings/earningsController')

module.exports = {
  stats: dashboardController.stats,
  students: studentController.students,
  earnings: earningsController.earnings,
}
