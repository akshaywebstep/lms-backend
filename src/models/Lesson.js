
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Lesson = sequelize.define(
  'Lesson',
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
    title: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content_type: {
      type: DataTypes.ENUM('video', 'document', 'quiz', 'assignment'),
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
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'published',
    },
  },
  {
    tableName: 'lessons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = Lesson
