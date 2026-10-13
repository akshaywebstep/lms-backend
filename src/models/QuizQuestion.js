'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const QuizQuestion = sequelize.define(
  'QuizQuestion',
  {
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
      defaultValue: 1.0,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'quiz_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = QuizQuestion
