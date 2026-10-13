'use strict'

const { Payment, Enrollment, Course, User, Notification } = require('../../models')
const { makeId } = require('../../utils/id')
const { sendMail } = require('../mail')
const { env } = require('../../config/db')

class PaymentService {
  static async checkout(user, { courseId, provider = 'demo' }) {
    const course = await Course.findByPk(courseId)
    if (!course) throw { status: 404, message: 'Course not found' }

    const existing = await Enrollment.findOne({
      where: { student_id: user.id, course_id: courseId },
    })
    if (existing) throw { status: 409, message: 'Already enrolled in this course' }

    const paymentId = makeId('pay')
    const orderId = `order_${Date.now()}`

    const payment = await Payment.create({
      id: paymentId,
      order_id: orderId,
      provider,
      student_id: user.id,
      coach_id: course.coach_id,
      course_id: course.id,
      amount: course.price,
      currency: course.currency,
      status: 'completed',
      paid_at: new Date(),
    })

    const enrollmentId = makeId('enr')
    const enrollment = await Enrollment.create({
      id: enrollmentId,
      student_id: user.id,
      coach_id: course.coach_id,
      course_id: course.id,
      payment_id: paymentId,
      amount: course.price,
      currency: course.currency,
      status: 'active',
      progress: 0.0,
      enrolled_at: new Date(),
    })

    await Notification.create({
      id: makeId('notif'),
      type: 'payment',
      recipient_id: course.coach_id,
      title: 'New Course Sale',
      message: `${user.name} enrolled in ${course.title}.`,
    }).catch(() => {})

    await sendMail({
      module: 'student',
      action: 'course-purchased',
      to: user.email,
      vars: {
        name: user.name,
        courseName: course.title,
        amount: course.price,
        currency: course.currency,
        appName: env.appName,
      },
    }).catch(() => {})

    return {
      success: true,
      payment,
      enrollment,
      message: 'Enrollment completed successfully',
    }
  }

  static async listPaymentsForUser(userId) {
    const payments = await Payment.findAll({
      where: { student_id: userId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
      order: [['created_at', 'DESC']],
    })
    return payments
  }
}

module.exports = PaymentService
