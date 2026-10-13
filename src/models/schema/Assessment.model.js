'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/db')
const { Course, Lesson } = require('./Course.model')

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  course_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING(220),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  passing_score: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 50.00,
  },
  drip_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
  },
}, {
  tableName: 'quizzes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  quiz_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  question_type: {
    type: DataTypes.ENUM('mcq', 'true_false', 'short_answer'),
    allowNull: false,
    defaultValue: 'mcq',
  },
  options_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  correct_answer_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  marks: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 1.00,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'quiz_questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  course_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING(220),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  attachment_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  attachment_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  due_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  max_score: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 100.00,
  },
  drip_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
  },
}, {
  tableName: 'assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'questions' })
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' })

Course.hasMany(Quiz, { foreignKey: 'course_id', as: 'quizzes' })
Quiz.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments' })
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

module.exports = { Quiz, QuizQuestion, Assignment }
