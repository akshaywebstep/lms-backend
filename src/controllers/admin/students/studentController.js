
const AdminStudentService = require('../../../services/admin/students/adminStudentService')
const { logActivity } = require('../../../utils/admin/activityLogger')
const { createNotification } = require('../../../utils/admin/notificationHelper')

const PANEL = 'admin'
const MODULE = 'students'

/**
 * 1. Get Students List
 * GET /api/admin/students
 */
exports.students = async (req, res) => {
  try {
    const result = await AdminStudentService.getAllStudents()
    try {
      await logActivity(req, PANEL, MODULE, 'view_students', { count: result.data?.students?.length || 0 }, result.status)
    } catch (e) {}
    return res.status(result.status ? 200 : 500).json(result)
  } catch (error) {
    console.error('❌ Error in students controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 2. Create Student
 * POST /api/admin/students
 */
exports.createStudent = async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.name || !body.email) {
      return res.status(400).json({ status: false, success: false, message: 'Name and email are required', data: null })
    }
    const result = await AdminStudentService.createStudent(body)
    if (!result.status) {
      try {
        await logActivity(req, PANEL, MODULE, 'create', result, false)
      } catch (e) {}
      return res.status(400).json(result)
    }

    try {
      await logActivity(req, PANEL, MODULE, 'create', result.data, true)
    } catch (e) {}

    return res.status(201).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 3. Get Student Detail
 * GET /api/admin/students/:id
 */
exports.studentDetail = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminStudentService.getStudentById(id)
    return res.status(result.status ? 200 : 404).json(result)
  } catch (error) {
    console.error('❌ Error in studentDetail controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 4. Update Student
 * PUT /api/admin/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminStudentService.updateStudent(id, req.body)
    if (!result.status) {
      try {
        await logActivity(req, PANEL, MODULE, 'update', result, false)
      } catch (e) {}
      return res.status(400).json(result)
    }
    try {
      await logActivity(req, PANEL, MODULE, 'update', result.data, true)
    } catch (e) {}
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 5. Delete Student
 * DELETE /api/admin/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params
    const result = await AdminStudentService.deleteStudent(id)
    if (!result.status) {
      try {
        await logActivity(req, PANEL, MODULE, 'delete', result, false)
      } catch (e) {}
      return res.status(404).json(result)
    }
    try {
      await logActivity(req, PANEL, MODULE, 'delete', { id }, true)
    } catch (e) {}
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}

/**
 * 6. Update Student Status
 * PATCH /api/admin/students/:id/status
 */
exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ status: false, success: false, message: 'Invalid status', data: null })
    }
    const result = await AdminStudentService.updateStudentStatus(id, status)
    try {
      await logActivity(req, PANEL, MODULE, 'status_update', { id, status }, result.status)
    } catch (e) {}
    return res.status(result.status ? 200 : 400).json(result)
  } catch (error) {
    console.error('❌ Error in updateStudentStatus controller:', error)
    return res.status(500).json({ status: false, message: 'Internal server error: ' + error.message, data: null })
  }
}
