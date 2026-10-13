'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const PlatformSetting = sequelize.define(
  'PlatformSetting',
  {
    setting_key: {
      type: DataTypes.STRING(120),
      primaryKey: true,
    },
    setting_value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: 'platform_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = PlatformSetting
