'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const { User } = require('./User.model')
const { Course } = require('./Course.model')

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  coach_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  course_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  payment_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.CHAR(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'active',
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  enrolled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'enrollments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  provider_payment_id: {
    type: DataTypes.STRING(160),
    allowNull: true,
  },
  provider: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: 'demo',
  },
  student_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  coach_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  course_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.CHAR(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  student_details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING(40),
    allowNull: false,
    defaultValue: 'info',
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
    type: DataTypes.ENUM('superadmin', 'coach', 'student'),
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
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})

Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' })
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })
Payment.belongsTo(User, { foreignKey: 'student_id', as: 'student' })
Payment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

module.exports = { Enrollment, Payment, Notification }
