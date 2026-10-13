'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'general',
    },
    sender_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    recipient_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    recipient_role: {
      type: DataTypes.ENUM('admin', 'coach', 'student', 'all'),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
)

module.exports = Notification
