'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const PasswordOtp = sequelize.define(
  'PasswordOtp',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    otp_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING(64),
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
    tableName: 'password_otps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
)

module.exports = PasswordOtp
