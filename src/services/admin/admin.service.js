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
const { env, sequelize } = require('../../config/db')
const { sendMail } = require('../mail')
const { toPublicUser, cleanEmail } = require('../../utils/userHelper')
const { Op } = require('sequelize')

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
        Payment.count({ where: { status: { [Op.in]: ['completed', 'success'] } } }),
      ])

      const revenueSum = await Payment.sum('amount', {
        where: { status: { [Op.in]: ['completed', 'success'] } },
      })
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
   * 2. List All Coaches with Detailed Stats
   */
  static async getAllCoaches() {
    try {
      const coaches = await User.findAll({
        where: { role: 'coach' },
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Course, as: 'coachedCourses', attributes: ['id', 'title', 'price', 'status'] },
          { model: Enrollment, as: 'coachEnrollments', attributes: ['id', 'student_id'] },
        ],
        order: [['created_at', 'DESC']],
      })

      const formatted = await Promise.all(
        coaches.map(async (c) => {
          const plain = toPublicUser(c)
          const courseCount = (c.coachedCourses || []).length
          const studentCount = new Set((c.coachEnrollments || []).map((e) => e.student_id)).size
          const revenue = await Payment.sum('amount', {
            where: { coach_id: c.id, status: { [Op.in]: ['completed', 'success'] } },
          })

          return {
            ...plain,
            stats: {
              courses: courseCount,
              students: studentCount,
              revenue: Number(revenue || 0),
            },
          }
        })
      )

      return {
        status: true,
        message: 'Coaches fetched successfully.',
        data: { coaches: formatted },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getAllCoaches:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 3. Create a Coach
   */
  static async createCoach(body) {
    try {
      const { name, email, password, phone, title, bio, education, expertise, city, state, country } = body
      const clean = cleanEmail(email)

      const existing = await User.findOne({ where: { email: clean } })
      if (existing) {
        return { status: false, message: 'Email is already registered.' }
      }

      const defaultPass = password || 'password123'
      const hashed = hashPassword(defaultPass)
      const coachId = makeId('coach')

      await sequelize.transaction(async (t) => {
        await User.create(
          {
            id: coachId,
            name: String(name).trim(),
            email: clean,
            role: ROLES.COACH,
            title: title || 'Coach',
            status: 'active',
            password_hash: hashed.passwordHash,
            salt: hashed.salt,
          },
          { transaction: t }
        )

        await UserProfile.create(
          {
            user_id: coachId,
            phone: phone || null,
            bio: bio || null,
            education: education || null,
            expertise: expertise || null,
            city: city || null,
            state: state || null,
            country: country || 'India',
          },
          { transaction: t }
        )
      })

      const createdCoach = await User.findOne({
        where: { id: coachId },
        include: [{ model: UserProfile, as: 'profile' }],
      })

      await sendMail({
        module: 'coach',
        action: 'coach-welcome',
        to: clean,
        vars: {
          name: createdCoach.name,
          appName: env.appName,
          email: clean,
          password: defaultPass,
        },
      }).catch(() => {})

      return {
        status: true,
        message: 'Coach created successfully.',
        data: { coach: toPublicUser(createdCoach), defaultPassword: defaultPass },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.createCoach:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 4. Get Coach by ID
   */
  static async getCoachById(id) {
    try {
      const coach = await User.findOne({
        where: { id, role: 'coach' },
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Course, as: 'coachedCourses' },
        ],
      })

      if (!coach) return { status: false, message: 'Coach not found.' }

      return {
        status: true,
        message: 'Coach fetched successfully.',
        data: { coach: toPublicUser(coach) },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getCoachById:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 5. Update Coach
   */
  static async updateCoach(id, body) {
    try {
      const coach = await User.findOne({ where: { id, role: 'coach' } })
      if (!coach) return { status: false, message: 'Coach not found.' }

      const userUpdates = {}
      if (body.name) userUpdates.name = body.name
      if (body.email) userUpdates.email = cleanEmail(body.email)
      if (body.title) userUpdates.title = body.title
      if (body.status) userUpdates.status = body.status
      if (body.avatar || body.avatar_url) userUpdates.avatar_url = body.avatar || body.avatar_url

      if (Object.keys(userUpdates).length > 0) {
        await User.update(userUpdates, { where: { id } })
      }

      const p = body.profile || body
      await UserProfile.upsert({
        user_id: id,
        phone: p.phone,
        city: p.city,
        state: p.state,
        country: p.country,
        bio: p.bio,
        education: p.education,
        expertise: p.expertise,
      })

      const updated = await User.findOne({
        where: { id },
        include: [{ model: UserProfile, as: 'profile' }],
      })

      return { status: true, message: 'Coach updated successfully.', data: { coach: toPublicUser(updated) } }
    } catch (error) {
      console.error('❌ Error in AdminService.updateCoach:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 6. Delete Coach
   */
  static async deleteCoach(id) {
    try {
      await User.destroy({ where: { id, role: 'coach' } })
      return { status: true, message: 'Coach deleted successfully.', data: { deleted: true, coachId: id } }
    } catch (error) {
      console.error('❌ Error in AdminService.deleteCoach:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 7. Update Coach Status
   */
  static async updateCoachStatus(id, status) {
    try {
      await User.update({ status }, { where: { id, role: 'coach' } })
      const coach = await User.findByPk(id)
      return {
        status: true,
        message: 'Coach status updated.',
        data: { coach: toPublicUser(coach) },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.updateCoachStatus:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 8. List All Students
   */
  static async getAllStudents() {
    try {
      const students = await User.findAll({
        where: { role: 'student' },
        include: [{ model: UserProfile, as: 'profile' }],
        order: [['created_at', 'DESC']],
      })

      return {
        status: true,
        message: 'Students fetched successfully.',
        data: { students: students.map(toPublicUser) },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getAllStudents:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 9. Create Student
   */
  static async createStudent(body) {
    try {
      const { name, email, password, phone, city, state, country, bio, addressLine1, pincode } = body
      const clean = cleanEmail(email)

      const existing = await User.findOne({ where: { email: clean } })
      if (existing) return { status: false, message: 'Email is already registered.' }

      const defaultPass = password || 'password123'
      const hashed = hashPassword(defaultPass)
      const studentId = makeId('student')

      await sequelize.transaction(async (t) => {
        await User.create(
          {
            id: studentId,
            name: String(name).trim(),
            email: clean,
            role: ROLES.STUDENT,
            title: 'Student',
            status: 'active',
            password_hash: hashed.passwordHash,
            salt: hashed.salt,
          },
          { transaction: t }
        )

        await UserProfile.create(
          {
            user_id: studentId,
            phone: phone || null,
            city: city || null,
            state: state || null,
            country: country || 'India',
            bio: bio || null,
            address_line1: addressLine1 || null,
            pincode: pincode || null,
          },
          { transaction: t }
        )
      })

      const student = await User.findOne({
        where: { id: studentId },
        include: [{ model: UserProfile, as: 'profile' }],
      })

      await sendMail({
        module: 'student',
        action: 'student-registered',
        to: clean,
        vars: {
          name: student.name,
          appName: env.appName,
          email: clean,
          password: defaultPass,
        },
      }).catch(() => {})

      return {
        status: true,
        message: 'Student created successfully.',
        data: { student: toPublicUser(student), defaultPassword: defaultPass },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.createStudent:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 10. Get Student by ID
   */
  static async getStudentById(id) {
    try {
      const student = await User.findOne({
        where: { id, role: 'student' },
        include: [
          { model: UserProfile, as: 'profile' },
          { model: Enrollment, as: 'enrollments', include: [{ model: Course, as: 'course' }] },
        ],
      })

      if (!student) return { status: false, message: 'Student not found.' }

      return {
        status: true,
        message: 'Student fetched successfully.',
        data: { student: toPublicUser(student) },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getStudentById:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 11. Update Student
   */
  static async updateStudent(id, body) {
    try {
      const student = await User.findOne({ where: { id, role: 'student' } })
      if (!student) return { status: false, message: 'Student not found.' }

      const userUpdates = {}
      if (body.name) userUpdates.name = body.name
      if (body.email) userUpdates.email = cleanEmail(body.email)
      if (body.status) userUpdates.status = body.status
      if (body.avatar || body.avatar_url) userUpdates.avatar_url = body.avatar || body.avatar_url

      if (Object.keys(userUpdates).length > 0) {
        await User.update(userUpdates, { where: { id } })
      }

      const p = body.profile || body
      await UserProfile.upsert({
        user_id: id,
        phone: p.phone,
        city: p.city,
        state: p.state,
        country: p.country,
        bio: p.bio,
        address_line1: p.addressLine1 || p.address_line1,
        pincode: p.pincode,
      })

      const updated = await User.findOne({
        where: { id },
        include: [{ model: UserProfile, as: 'profile' }],
      })

      return { status: true, message: 'Student updated successfully.', data: { student: toPublicUser(updated) } }
    } catch (error) {
      console.error('❌ Error in AdminService.updateStudent:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 12. Delete Student
   */
  static async deleteStudent(id) {
    try {
      await User.destroy({ where: { id, role: 'student' } })
      return { status: true, message: 'Student deleted successfully.', data: { deleted: true, studentId: id } }
    } catch (error) {
      console.error('❌ Error in AdminService.deleteStudent:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 13. Update Student Status
   */
  static async updateStudentStatus(id, status) {
    try {
      await User.update({ status }, { where: { id, role: 'student' } })
      const student = await User.findByPk(id)
      return {
        status: true,
        message: 'Student status updated.',
        data: { student: toPublicUser(student) },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.updateStudentStatus:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 14. List All Payments
   */
  static async getAllPayments() {
    try {
      const payments = await Payment.findAll({
        include: [
          { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
          { model: Course, as: 'course', attributes: ['id', 'title'] },
          { model: User, as: 'coach', attributes: ['id', 'name', 'email'] },
        ],
        order: [['created_at', 'DESC']],
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
   * 15. Platform Settings
   */
  static async getPlatformSettings() {
    try {
      const rows = await PlatformSetting.findAll()
      const settings = {}
      rows.forEach((r) => {
        settings[r.setting_key] = r.setting_value
      })
      return {
        status: true,
        message: 'Platform settings fetched successfully.',
        data: { settings },
      }
    } catch (error) {
      console.error('❌ Error in AdminService.getPlatformSettings:', error)
      return { status: false, message: error.message }
    }
  }

  static async updatePlatformSettings(body) {
    try {
      for (const [key, val] of Object.entries(body || {})) {
        await PlatformSetting.upsert({ setting_key: key, setting_value: val })
      }
      return this.getPlatformSettings()
    } catch (error) {
      console.error('❌ Error in AdminService.updatePlatformSettings:', error)
      return { status: false, message: error.message }
    }
  }

  /**
   * 16. Reports & Subscriptions
   */
  static async getReports() {
    try {
      const revenueSum = await Payment.sum('amount', {
        where: { status: { [Op.in]: ['completed', 'success'] } },
      })
      const courses = await Course.findAll({
        include: [
          { model: Enrollment, as: 'enrollments', attributes: ['id'] },
          { model: Payment, as: 'payments', attributes: ['amount', 'status'] },
        ],
      })

      const courseSales = courses.map((c) => {
        const sales = (c.enrollments || []).length
        const rev = (c.payments || [])
          .filter((p) => p.status === 'completed' || p.status === 'success')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
        return {
          id: c.id,
          title: c.title,
          sales,
          revenue: rev,
        }
      })

      return {
        status: true,
        data: {
          reports: {
            revenue: Number(revenueSum || 0),
            courseSales,
          },
        },
      }
    } catch (error) {
      return { status: false, message: error.message }
    }
  }

  static async getSubscriptions() {
    try {
      const rows = await PlatformSetting.findAll({
        where: { setting_key: { [Op.like]: 'pricing_plans:%' } },
      })
      const plans = rows.flatMap((row) => {
        const coachId = row.setting_key.replace('pricing_plans:', '')
        const list = Array.isArray(row.setting_value) ? row.setting_value : []
        return list.map((plan) => ({ ...plan, coachId }))
      })
      return {
        status: true,
        data: { subscriptions: plans, plans, total: plans.length },
      }
    } catch (error) {
      return { status: false, message: error.message }
    }
  }
}

module.exports = AdminService
