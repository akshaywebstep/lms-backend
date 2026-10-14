
const AdminPaymentService = require('../../../services/admin/payments/adminPaymentService')

/**
 * 1. Get Payments List
 * GET /api/admin/payments
 */
exports.payments = async (req, res) => {
  try {
    const result = await AdminPaymentService.getAllPayments()
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    console.error('❌ Error in payments controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}
