'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const LessonTopic = sequelize.define(
  'LessonTopic',
  {
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
  },
  {
    tableName: 'lesson_topics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = LessonTopic
