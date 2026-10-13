'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const RevokedToken = sequelize.define(
  'RevokedToken',
  {
    token_id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'revoked_tokens',
    timestamps: false,
  }
)

module.exports = RevokedToken
