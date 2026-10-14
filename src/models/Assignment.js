
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Assignment = sequelize.define(
  'Assignment',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'courses', key: 'id' },
      onDelete: 'CASCADE',
    },
    lesson_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      references: { model: 'lessons', key: 'id' },
      onDelete: 'SET NULL',
    },
    title: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    drip_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    max_score: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 100.0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    tableName: 'assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = Assignment
