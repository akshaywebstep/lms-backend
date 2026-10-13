'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/db')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(190),
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'coach', 'student'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'blocked', 'pending'),
    allowNull: false,
    defaultValue: 'active',
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  salt: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const UserProfile = sequelize.define('UserProfile', {
  user_id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expertise: {
    type: DataTypes.STRING(190),
    allowNull: true,
  },
  education: {
    type: DataTypes.STRING(190),
    allowNull: true,
  },
  address_line1: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(120),
    allowNull: true,
    defaultValue: 'India',
  },
  pincode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'user_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile' })
UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

module.exports = { User, UserProfile }
