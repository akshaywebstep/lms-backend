'use strict'

const { User, UserProfile } = require('./schema/User.model')
const { Course, Lesson, LessonTopic } = require('./schema/Course.model')
const { CourseRequirement, CourseOutcome, CourseMasterOption } = require('./schema/CourseMeta.model')
const { Quiz, QuizQuestion, Assignment } = require('./schema/Assessment.model')
const { Enrollment, Payment, Notification } = require('./schema/Enrollment.model')
const { EmailConfig, PlatformSetting, Upload, Certificate } = require('./schema/System.model')

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
