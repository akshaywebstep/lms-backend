'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Payment = sequelize.define(
  'Payment',
  {
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
      type: DataTypes.ENUM('created', 'processing', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'completed',
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
  },
  {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = Payment
