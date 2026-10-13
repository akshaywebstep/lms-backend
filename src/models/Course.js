'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Course = sequelize.define(
  'Course',
  {
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
      defaultValue: 0.0,
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
  },
  {
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = Course
