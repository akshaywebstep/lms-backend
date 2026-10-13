'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const { Course } = require('./Course.model')

const CourseRequirement = sequelize.define('CourseRequirement', {
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
}, {
  tableName: 'course_requirements',
  timestamps: false,
})

const CourseOutcome = sequelize.define('CourseOutcome', {
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
  outcome_text: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
}, {
  tableName: 'course_outcomes',
  timestamps: false,
})

const CourseMasterOption = sequelize.define('CourseMasterOption', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('category', 'difficulty', 'language'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  created_by: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  creator_role: {
    type: DataTypes.ENUM('system', 'superadmin', 'coach'),
    allowNull: false,
    defaultValue: 'system',
  },
}, {
  tableName: 'course_master_options',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

Course.hasMany(CourseRequirement, { foreignKey: 'course_id', as: 'requirementsList' })
CourseRequirement.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

Course.hasMany(CourseOutcome, { foreignKey: 'course_id', as: 'outcomesList' })
CourseOutcome.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

module.exports = { CourseRequirement, CourseOutcome, CourseMasterOption }
