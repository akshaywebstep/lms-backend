'use strict'

const { User, UserProfile } = require('./sequelize/User.model')
const { Course, Lesson, LessonTopic } = require('./sequelize/Course.model')
const { CourseRequirement, CourseOutcome, CourseMasterOption } = require('./sequelize/CourseMeta.model')
const { Quiz, QuizQuestion, Assignment } = require('./sequelize/Assessment.model')
const { Enrollment, Payment, Notification } = require('./sequelize/Enrollment.model')
const { EmailConfig, PlatformSetting, Upload, Certificate } = require('./sequelize/System.model')

module.exports = {
  User,
  UserProfile,
  Course,
  CourseRequirement,
  CourseOutcome,
  CourseMasterOption,
  Lesson,
  LessonTopic,
  Quiz,
  QuizQuestion,
  Assignment,
  Enrollment,
  Payment,
  Notification,
  EmailConfig,
  PlatformSetting,
  Upload,
  Certificate,
}
