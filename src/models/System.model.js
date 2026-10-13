'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const EmailConfig = sequelize.define('EmailConfig', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  template_key: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  module: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(220),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  html_body: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  variables_schema: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'email_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const PlatformSetting = sequelize.define('PlatformSetting', {
  setting_key: {
    type: DataTypes.STRING(120),
    primaryKey: true,
  },
  setting_value: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  tableName: 'platform_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

const Upload = sequelize.define('Upload', {
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
}, {
  tableName: 'uploads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  course_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  enrollment_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
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
}, {
  tableName: 'certificates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})

module.exports = { EmailConfig, PlatformSetting, Upload, Certificate }
