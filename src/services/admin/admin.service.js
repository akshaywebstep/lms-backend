'use strict'

const {
  User,
  UserProfile,
  Course,
  Payment,
  Enrollment,
  EmailConfig,
  PlatformSetting,
  CourseMasterOption,
} = require('../../models')
const { hashPassword } = require('../../utils/password')
const { makeId } = require('../../utils/id')
const { ROLES } = require('../../config/constants')
const { env, query, first } = require('../../config/db')
const { sendMail } = require('../mail')

class AdminService {
  static async getStats() {
    const [totalUsers, totalCoaches, totalStudents, totalCourses, totalPayments] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'coach' } }),
      User.count({ where: { role: 'student' } }),
      Course.count(),
      Payment.count({ where: { status: 'success' } }),
    ])

    const revenueResult = await Payment.sum('amount', { where: { status: 'success' } })
    const totalRevenue = Number(revenueResult || 0)

    const recentUsers = await User.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
    })

    const recentPayments = await Payment.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
      ],
    })

    return {
      stats: {
        totalUsers,
        totalCoaches,
        totalStudents,
        totalCourses,
        totalPayments,
        totalRevenue,
      },
      recentUsers,
      recentPayments,
    }
  }

  static async listCoaches() {
    const coaches = await User.findAll({
      where: { role: 'coach' },
      include: [{ model: UserProfile, as: 'profile' }],
      order: [['created_at', 'DESC']],
    })
    return coaches.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      title: c.title,
      status: c.status,
      avatar: c.avatar_url,
      profile: c.profile ? c.profile.toJSON() : {},
      createdAt: c.created_at,
    }))
  }

  static async createCoach(body) {
    const id = makeId('coach')
    const password = body.password || 'password123'
    const { passwordHash, salt } = hashPassword(password)

    const coach = await User.create({
      id,
      name: body.name,
      email: body.email.toLowerCase().trim(),
      role: ROLES.COACH,
      title: body.title || 'Course Instructor',
      status: 'active',
      avatar_url: body.avatar || null,
      password_hash: passwordHash,
      salt,
      email_verified_at: new Date(),
    })

    if (body.profile || body.phone || body.city || body.expertise) {
      await UserProfile.create({
        user_id: id,
        phone: body.phone || body.profile?.phone || null,
        city: body.city || body.profile?.city || null,
        expertise: body.expertise || body.profile?.expertise || null,
        bio: body.bio || body.profile?.bio || null,
      })
    }

    await sendMail({
      module: 'admin',
      action: 'coach-created',
      to: coach.email,
      vars: { name: coach.name, email: coach.email, password, appName: env.appName },
    })

    return {
      id: coach.id,
      name: coach.name,
      email: coach.email,
      role: coach.role,
      status: coach.status,
    }
  }

  static async getCoachDetail(coachId) {
    const coach = await User.findOne({
      where: { id: coachId, role: 'coach' },
      include: [{ model: UserProfile, as: 'profile' }],
    })
    if (!coach) return null

    const courses = await Course.findAll({
      where: { coach_id: coachId },
      order: [['created_at', 'DESC']],
    })

    return {
      coach: {
        id: coach.id,
        name: coach.name,
        email: coach.email,
        role: coach.role,
        title: coach.title,
        status: coach.status,
        avatar: coach.avatar_url,
        profile: coach.profile ? coach.profile.toJSON() : {},
        courses,
        createdAt: coach.created_at,
      },
    }
  }

  static async updateCoachStatus(coachId, status) {
    await User.update({ status }, { where: { id: coachId, role: 'coach' } })
    return this.getCoachDetail(coachId)
  }

  static async listStudents() {
    const students = await User.findAll({
      where: { role: 'student' },
      include: [{ model: UserProfile, as: 'profile' }],
      order: [['created_at', 'DESC']],
    })
    return students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      title: s.title,
      status: s.status,
      avatar: s.avatar_url,
      profile: s.profile ? s.profile.toJSON() : {},
      createdAt: s.created_at,
    }))
  }

  static async getStudentDetail(studentId) {
    const student = await User.findOne({
      where: { id: studentId, role: 'student' },
      include: [{ model: UserProfile, as: 'profile' }],
    })
    if (!student) return null

    const enrollments = await Enrollment.findAll({
      where: { student_id: studentId },
      include: [{ model: Course, as: 'course' }],
    })

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
        title: student.title,
        status: student.status,
        avatar: student.avatar_url,
        profile: student.profile ? student.profile.toJSON() : {},
        enrollments,
        createdAt: student.created_at,
      },
    }
  }

  static async updateStudentStatus(studentId, status) {
    await User.update({ status }, { where: { id: studentId, role: 'student' } })
    return this.getStudentDetail(studentId)
  }

  static async listPayments() {
    const payments = await Payment.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
      ],
    })
    return payments
  }

  static async getReports() {
    const monthlyRevenue = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS revenue, COUNT(*) AS count
      FROM payments
      WHERE status = 'success'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `)
    return { monthlyRevenue }
  }

  static async getPlatformSettings() {
    const settings = await PlatformSetting.findAll()
    const map = {}
    settings.forEach((s) => { map[s.setting_key] = s.setting_value })
    return { settings: map }
  }

  static async updatePlatformSettings(body) {
    for (const [key, val] of Object.entries(body)) {
      await PlatformSetting.upsert({ setting_key: key, setting_value: val })
    }
    return this.getPlatformSettings()
  }
}

module.exports = AdminService
