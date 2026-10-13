'use strict'

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const EmailConfig = sequelize.define(
  'EmailConfig',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    module: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    coach_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    html_template: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    smtp_host: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    smtp_secure: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    smtp_port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 465,
    },
    smtp_username: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    smtp_password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    from_email: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    from_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    variables: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('variables')
        if (!raw) return []
        if (Array.isArray(raw)) return raw
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed
            return [parsed]
          } catch {
            return raw.split(',').map((s) => s.trim()).filter(Boolean)
          }
        }
        return []
      },
      set(val) {
        if (!val) {
          this.setDataValue('variables', null)
        } else if (Array.isArray(val) || typeof val === 'object') {
          this.setDataValue('variables', JSON.stringify(val))
        } else {
          this.setDataValue('variables', val)
        }
      },
    },
    to: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bcc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'email_configs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
)

module.exports = EmailConfig
