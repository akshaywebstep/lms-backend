
const { Payment, User, Course } = require('../../../models')

exports.getAllPayments = async () => {
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
    console.error('❌ Error in AdminPaymentService.getAllPayments:', error)
    return { status: false, message: error.message, data: null }
  }
}
