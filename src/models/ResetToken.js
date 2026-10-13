'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const ResetToken = sequelize.define(
  'ResetToken',
  {
    token: {
      type: DataTypes.STRING(128),
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'reset_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
)

module.exports = ResetToken
