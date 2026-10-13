'use strict'

const {
  User,
  UserProfile,
  Course,
  Payment,
  Enrollment,
  PlatformSetting,
  EmailConfig,
  CourseMasterOption,
} = require('../../models')
const { hashPassword } = require('../../utils/password')
const { makeId } = require('../../utils/id')
const { ROLES } = require('../../config/constants')
const { env, query } = require('../../config/db')
const { sendMail } = require('../mail')

class AdminService {
  /**
   * 1. Get Dashboard Statistics & Overview
   */
  static async getDashboardStats() {
    try {
      const [totalUsers, totalCoaches, totalStudents, totalCourses, totalPayments] = await Promise.all([
        User.count(),
        User.count({ where: { role: 'coach' } }),
        User.count({ where: { role: 'student' } }),
        Course.count(),
        Payment.count({ where: { status: 'success' } }),
      ])

      const revenueSum = await Payment.sum('amount', { where: { status: 'success' } })
      const totalRevenue = Number(revenueSum || 0)

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
        status: true,
        message: 'Dashboard statistics fetched successfully.',
        data: {
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
        },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getDashboardStats:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 2. List all Coaches
   */
  static async getAllCoaches() {
    try {
      const coaches = await User.findAll({
        where: { role: 'coach' },
        include: [{ model: UserProfile, as: 'profile' }],
        order: [['created_at', 'DESC']],
      })

      const data = coaches.map((c) => ({
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

      return {
        status: true,
        message: 'Coaches fetched successfully.',
        data: { coaches: data },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getAllCoaches:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 3. Create a new Coach
   */
  static async createCoach(body) {
    try {
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
        status: true,
        message: 'Coach created successfully.',
        data: {
          coach: {
            id: coach.id,
            name: coach.name,
            email: coach.email,
            role: coach.role,
            status: coach.status,
          },
        },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.createCoach:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 4. Get Coach detail by ID
   */
  static async getCoachById(coachId) {
    try {
      const coach = await User.findOne({
        where: { id: coachId, role: 'coach' },
        include: [{ model: UserProfile, as: 'profile' }],
      })
      if (!coach) return { status: false, message: 'Coach not found.' }

      const courses = await Course.findAll({
        where: { coach_id: coachId },
        order: [['created_at', 'DESC']],
      })

      return {
        status: true,
        message: 'Coach detail fetched successfully.',
        data: {
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
        },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getCoachById:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 5. Update Coach status
   */
  static async updateCoachStatus(coachId, status) {
    try {
      await User.update({ status }, { where: { id: coachId, role: 'coach' } })
      return this.getCoachById(coachId)
    } catch (error) {
      console.error('❌ Error in AdminService.updateCoachStatus:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 6. List all Students
   */
  static async getAllStudents() {
    try {
      const students = await User.findAll({
        where: { role: 'student' },
        include: [{ model: UserProfile, as: 'profile' }],
        order: [['created_at', 'DESC']],
      })

      const data = students.map((s) => ({
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

      return {
        status: true,
        message: 'Students fetched successfully.',
        data: { students: data },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getAllStudents:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 7. Get Student detail by ID
   */
  static async getStudentById(studentId) {
    try {
      const student = await User.findOne({
        where: { id: studentId, role: 'student' },
        include: [{ model: UserProfile, as: 'profile' }],
      })
      if (!student) return { status: false, message: 'Student not found.' }

      const enrollments = await Enrollment.findAll({
        where: { student_id: studentId },
        include: [{ model: Course, as: 'course' }],
      })

      return {
        status: true,
        message: 'Student detail fetched successfully.',
        data: {
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
        },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getStudentById:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 8. Update Student status
   */
  static async updateStudentStatus(studentId, status) {
    try {
      await User.update({ status }, { where: { id: studentId, role: 'student' } })
      return this.getStudentById(studentId)
    } catch (error) {
      console.error('❌ Error in AdminService.updateStudentStatus:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 9. List Payments
   */
  static async getAllPayments() {
    try {
      const payments = await Payment.findAll({
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
          { model: Course, as: 'course', attributes: ['id', 'title'] },
        ],
      })
      return {
        status: true,
        message: 'Payments fetched successfully.',
        data: { payments },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getAllPayments:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 10. Platform Settings
   */
  static async getPlatformSettings() {
    try {
      const settings = await PlatformSetting.findAll()
      const map = {}
      settings.forEach((s) => { map[s.setting_key] = s.setting_value })
      return {
        status: true,
        message: 'Settings fetched successfully.',
        data: { settings: map },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getPlatformSettings:', error)
      return { status: false, message: error.message }
    }
  }

  static async updatePlatformSettings(body) {
    try {
      for (const [key, val] of Object.entries(body)) {
        await PlatformSetting.upsert({ setting_key: key, setting_value: val })
      }
      return this.getPlatformSettings()
    } catch (error) {
      console.error('❌ Error in AdminService.updatePlatformSettings:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = AdminService
