
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const CourseMasterOption = sequelize.define(
  'CourseMasterOption',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('category', 'difficulty', 'language'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_by: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    creator_role: {
      type: DataTypes.ENUM('system', 'superadmin', 'coach'),
      allowNull: false,
      defaultValue: 'system',
    },
  },
  {
    tableName: 'course_master_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = CourseMasterOption
