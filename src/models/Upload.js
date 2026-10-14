
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Upload = sequelize.define(
  'Upload',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    file_type: {
      type: DataTypes.ENUM('image', 'video', 'document'),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    size_bytes: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: 'uploads',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
)

module.exports = Upload
