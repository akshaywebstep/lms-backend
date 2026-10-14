
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Session = sequelize.define(
  'Session',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    access_token_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    refresh_token_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
)

module.exports = Session
