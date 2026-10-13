'use strict'

const { sequelize } = require('../config/db')

// =================== Import All Models (synconode 1-table-1-file pattern) =================== //
const User = require('./User')
const UserProfile = require('./UserProfile')
const Course = require('./Course')
const CourseRequirement = require('./CourseRequirement')
const CourseOutcome = require('./CourseOutcome')
const CourseMasterOption = require('./CourseMasterOption')
const Lesson = require('./Lesson')
const LessonTopic = require('./LessonTopic')
const Quiz = require('./Quiz')
const QuizQuestion = require('./QuizQuestion')
const QuizAttempt = require('./QuizAttempt')
const Assignment = require('./Assignment')
const AssignmentSubmission = require('./AssignmentSubmission')
const Enrollment = require('./Enrollment')
const LessonProgress = require('./LessonProgress')
const Payment = require('./Payment')
const Certificate = require('./Certificate')
const Notification = require('./Notification')
const EmailConfig = require('./EmailConfig')
const PlatformSetting = require('./PlatformSetting')
const Upload = require('./Upload')
const Session = require('./Session')
const RevokedToken = require('./RevokedToken')
const PasswordOtp = require('./PasswordOtp')
const ResetToken = require('./ResetToken')

// =================== Define Associations =================== //

// 👤 User & Profile
User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile' })
UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 📚 User & Courses (Coach)
User.hasMany(Course, { foreignKey: 'coach_id', as: 'coachedCourses' })
Course.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' })

// 📋 Course Requirements & Outcomes
Course.hasMany(CourseRequirement, { foreignKey: 'course_id', as: 'requirementsList' })
CourseRequirement.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

Course.hasMany(CourseOutcome, { foreignKey: 'course_id', as: 'outcomesList' })
CourseOutcome.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

// 🏷️ Course & Master Options (Category, Difficulty, Language)
Course.belongsTo(CourseMasterOption, { foreignKey: 'category_id', as: 'categoryOption' })
Course.belongsTo(CourseMasterOption, { foreignKey: 'difficulty_id', as: 'difficultyOption' })
Course.belongsTo(CourseMasterOption, { foreignKey: 'language_id', as: 'languageOption' })
CourseMasterOption.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })

// 🎓 Course & Lessons
Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons' })
Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

// 📝 Lesson & Topics
Lesson.hasMany(LessonTopic, { foreignKey: 'lesson_id', as: 'topics' })
LessonTopic.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' })

// ❓ Course / Lesson & Quizzes
Course.hasMany(Quiz, { foreignKey: 'course_id', as: 'quizzes' })
Quiz.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })
Lesson.hasMany(Quiz, { foreignKey: 'lesson_id', as: 'quizzes' })
Quiz.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' })

Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'questions' })
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' })

Quiz.hasMany(QuizAttempt, { foreignKey: 'quiz_id', as: 'attempts' })
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' })
User.hasMany(QuizAttempt, { foreignKey: 'student_id', as: 'quizAttempts' })
QuizAttempt.belongsTo(User, { foreignKey: 'student_id', as: 'student' })

// 📄 Course / Lesson & Assignments
Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments' })
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })
Lesson.hasMany(Assignment, { foreignKey: 'lesson_id', as: 'assignments' })
Assignment.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' })

Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignment_id', as: 'submissions' })
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' })
User.hasMany(AssignmentSubmission, { foreignKey: 'student_id', as: 'assignmentSubmissions' })
AssignmentSubmission.belongsTo(User, { foreignKey: 'student_id', as: 'student' })

// 💼 Enrollments
User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' })
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' })

Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' })
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

User.hasMany(Enrollment, { foreignKey: 'coach_id', as: 'coachEnrollments' })
Enrollment.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' })

// 📈 Lesson Progress
Enrollment.hasMany(LessonProgress, { foreignKey: 'enrollment_id', as: 'progressList' })
LessonProgress.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' })
Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id', as: 'progressRecords' })
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' })

// 💳 Payments
User.hasMany(Payment, { foreignKey: 'student_id', as: 'payments' })
Payment.belongsTo(User, { foreignKey: 'student_id', as: 'student' })
Course.hasMany(Payment, { foreignKey: 'course_id', as: 'payments' })
Payment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })
User.hasMany(Payment, { foreignKey: 'coach_id', as: 'coachPayments' })
Payment.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' })

// 📜 Certificates
User.hasMany(Certificate, { foreignKey: 'student_id', as: 'certificates' })
Certificate.belongsTo(User, { foreignKey: 'student_id', as: 'student' })
Course.hasMany(Certificate, { foreignKey: 'course_id', as: 'certificates' })
Certificate.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })
Enrollment.hasOne(Certificate, { foreignKey: 'enrollment_id', as: 'certificate' })
Certificate.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' })

// 🔔 Notifications
User.hasMany(Notification, { foreignKey: 'recipient_id', as: 'notifications' })
Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' })
Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' })

// 📤 Uploads
User.hasMany(Upload, { foreignKey: 'owner_id', as: 'uploads' })
Upload.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' })

// 🔑 Sessions
User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' })
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

const models = {
  sequelize,
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
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Enrollment,
  LessonProgress,
  Payment,
  Certificate,
  Notification,
  EmailConfig,
  PlatformSetting,
  Upload,
  Session,
  RevokedToken,
  PasswordOtp,
  ResetToken,
}

module.exports = models
