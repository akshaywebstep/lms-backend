const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const ActivityLog = sequelize.define(
  'ActivityLog',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'success',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['role'] },
      { fields: ['action'] },
      { fields: ['module'] },
      { fields: ['created_at'] },
    ],
  }
)

module.exports = ActivityLog
