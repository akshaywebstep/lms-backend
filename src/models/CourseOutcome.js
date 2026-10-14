
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const CourseOutcome = sequelize.define(
  'CourseOutcome',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'courses', key: 'id' },
      onDelete: 'CASCADE',
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
  },
  {
    tableName: 'course_outcomes',
    timestamps: false,
  }
)

module.exports = CourseOutcome
