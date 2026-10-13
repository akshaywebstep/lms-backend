'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/db')
const { User } = require('./User.model')

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  coach_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(220),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(240),
    allowNull: false,
    unique: true,
  },
  category: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: 'Beginner',
  },
  language: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: 'Hinglish',
  },
  category_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  difficulty_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  language_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.CHAR(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  promo_video: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  course_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(220),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content_type: {
    type: DataTypes.ENUM('video', 'document', 'link', 'text'),
    allowNull: false,
    defaultValue: 'video',
  },
  content_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_preview: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const LessonTopic = sequelize.define('LessonTopic', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  lesson_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(220),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'lesson_topics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// Associations
Course.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' })
User.hasMany(Course, { foreignKey: 'coach_id', as: 'courses' })

Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons' })
Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

Lesson.hasMany(LessonTopic, { foreignKey: 'lesson_id', as: 'topics' })
LessonTopic.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' })

module.exports = { Course, Lesson, LessonTopic }
