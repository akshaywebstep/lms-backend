'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const AssignmentSubmission = sequelize.define(
  'AssignmentSubmission',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    student_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    enrollment_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    answer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded', 'resubmitted'),
      allowNull: false,
      defaultValue: 'submitted',
    },
    score: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    graded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'assignment_submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = AssignmentSubmission
