'use strict'

const { User, UserProfile, Enrollment, Course } = require('../../../models')
const { hashPassword } = require('../../../utils/password')
const { makeId } = require('../../../utils/id')
const { ROLES } = require('../../../config/constants')
const { env, sequelize } = require('../../../config/db')
const { sendMail } = require('../../mail')
const { toPublicUser, cleanEmail } = require('../../../utils/userHelper')

class AdminStudentService {
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
      console.error('❌ Error in AdminStudentService.getAllStudents:', error)
      return { status: false, message: error.message }
    }
  }

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
      console.error('❌ Error in AdminStudentService.createStudent:', error)
      return { status: false, message: error.message }
    }
  }

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
      console.error('❌ Error in AdminStudentService.getStudentById:', error)
      return { status: false, message: error.message }
    }
  }

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
      console.error('❌ Error in AdminStudentService.updateStudent:', error)
      return { status: false, message: error.message }
    }
  }

  static async deleteStudent(id) {
    try {
      await User.destroy({ where: { id, role: 'student' } })
      return { status: true, message: 'Student deleted successfully.', data: { deleted: true, studentId: id } }
    } catch (error) {
      console.error('❌ Error in AdminStudentService.deleteStudent:', error)
      return { status: false, message: error.message }
    }
  }

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
      console.error('❌ Error in AdminStudentService.updateStudentStatus:', error)
      return { status: false, message: error.message }
    }
  }
}

module.exports = AdminStudentService
