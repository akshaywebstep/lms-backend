
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const QuizAttempt = sequelize.define(
  'QuizAttempt',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
    },
    quiz_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'quizzes', key: 'id' },
      onDelete: 'CASCADE',
    },
    student_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    enrollment_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      references: { model: 'enrollments', key: 'id' },
      onDelete: 'CASCADE',
    },
    answers_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    score: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'graded'),
      allowNull: false,
      defaultValue: 'completed',
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'quiz_attempts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

module.exports = QuizAttempt
