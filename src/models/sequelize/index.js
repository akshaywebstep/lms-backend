'use strict'

const { User, UserProfile } = require('./User.model')
const { Course, Lesson, LessonTopic } = require('./Course.model')
const { Quiz, QuizQuestion, Assignment } = require('./Assessment.model')
const { Enrollment, Payment, Notification } = require('./Enrollment.model')

module.exports = {
  User,
  UserProfile,
  Course,
  Lesson,
  LessonTopic,
  Quiz,
  QuizQuestion,
  Assignment,
  Enrollment,
  Payment,
  Notification,
}
