'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const CourseRequirement = sequelize.define(
  'CourseRequirement',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    requirement_text: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    tableName: 'course_requirements',
    timestamps: false,
  }
)

module.exports = CourseRequirement
