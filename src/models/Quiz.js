'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Quiz = sequelize.define(
  'Quiz',
  {
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
      defaultValue: 50.0,
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
  },
  {
    tableName: 'quizzes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = Quiz
