
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Certificate = sequelize.define(
  'Certificate',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    course_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'courses', key: 'id' },
      onDelete: 'CASCADE',
    },
    enrollment_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'enrollments', key: 'id' },
      onDelete: 'CASCADE',
    },
    certificate_no: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'certificates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
)

module.exports = Certificate
