const AuthService = require('../../services/auth/authService')
const UserService = require('../../services/profile/profileService')
const { ok, created, fail } = require('../../utils/response')
const { toPublicUser, cleanEmail } = require('../../utils/userHelper')
const { hashPassword, verifyPassword } = require('../../utils/password')
const { makeId } = require('../../utils/id')
const { sendMail } = require('../../services/mail')
const { PasswordOtp, ResetToken, User } = require('../../models')
const { env } = require('../../config/db')
const crypto = require('crypto')
const { Op } = require('sequelize')
const { logActivity } = require('../../services/activity/activityLogService')

const adminAuthController = require('./adminAuthController')
const coachAuthController = require('./coachAuthController')
const studentAuthController = require('./studentAuthController')

exports.admin = adminAuthController
exports.coach = coachAuthController
exports.student = studentAuthController

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.login = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const role = req.body?.role
    if (role === 'admin' || role === 'super_admin' || role === 'superadmin') {
      return adminAuthController.login(req, res)
    }
    if (role === 'coach') {
      return coachAuthController.login(req, res)
    }
    if (role === 'student') {
      return studentAuthController.login(req, res)
    }

    const session = await AuthService.login(req.body)
    return ok(res, session, 'Login successful.')
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Internal server error')
  }
}

exports.register = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const role = req.body?.role
    if (role === 'coach') {
      return coachAuthController.register(req, res)
    }
    return studentAuthController.register(req, res)
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Internal server error')
  }
}

exports.me = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  return ok(res, { user: toPublicUser(req.user) }, 'User profile fetched.')
}

exports.verifyToken = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  return ok(res, { valid: true, user: toPublicUser(req.user) }, 'Token is valid.')
}

exports.verifyEmail = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  return ok(
    res,
    { success: true, verified: true, token: req.body?.token || req.query?.token || null },
    'Email verified successfully.'
  )
}

exports.refreshToken = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const data = await AuthService.refreshToken(req.body?.refreshToken)
    return ok(res, data, 'Token refreshed successfully.')
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Internal server error')
  }
}

exports.logout = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const data = await AuthService.logout({
      user: req.user,
      tokenPayload: req.tokenPayload,
      refreshToken: req.body?.refreshToken,
    })

    if (req.user?.id) {
      await logActivity({
        req,
        userId: req.user.id,
        role: req.user.role,
        action: 'LOGOUT',
        module: 'auth',
        description: `User '${req.user.email || req.user.id}' logged out`,
        status: 'success',
      })
    }

    return ok(res, data, 'Logged out successfully.')
  } catch (err) {
    return fail(res, 500, 'Logout failed')
  }
}

exports.forgotPassword = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const email = cleanEmail(req.body?.email)
  if (!email) return fail(res, 400, 'Email is required')
  const userInstance = await UserService.findByEmail(email)
  if (!userInstance) {
    return fail(res, 404, 'No account found for this email')
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await ResetToken.create({
    token: resetToken,
    email,
    expires_at: expiresAt,
  })

  await sendMail({
    module: 'auth',
    action: 'forgot-password',
    to: email,
    vars: {
      name: userInstance.name,
      appName: env.appName,
      loginUrl: `${env.publicUrl}/reset-password?token=${resetToken}`,
    },
  }).catch(() => {})

  await logActivity({
    req,
    userId: userInstance.id,
    role: userInstance.role,
    action: 'FORGOT_PASSWORD_REQUEST',
    module: 'auth',
    description: `Password reset link requested for email '${email}'`,
    status: 'success',
    metadata: { email },
  })

  return ok(
    res,
    { success: true },
    'Password reset link sent to your email.'
  )
}

exports.requestPasswordOtp = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const email = cleanEmail(req.body?.email)
  if (!email) return fail(res, 400, 'Email is required')
  const userInstance = await UserService.findByEmail(email)
  if (!userInstance) {
    return fail(res, 404, 'No account found for this email')
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const salt = crypto.randomBytes(16).toString('hex')
  const otpHash = crypto
    .pbkdf2Sync(otp, salt, 1000, 64, 'sha512')
    .toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await PasswordOtp.create({
    email,
    otp_hash: otpHash,
    salt,
    expires_at: expiresAt,
  })

  await sendMail({
    module: 'auth',
    action: 'password-reset-otp',
    to: email,
    vars: {
      name: userInstance.name,
      appName: env.appName,
      otp,
    },
  }).catch(() => {})

  await logActivity({
    req,
    userId: userInstance.id,
    role: userInstance.role,
    action: 'REQUEST_PASSWORD_OTP',
    module: 'auth',
    description: `Password OTP requested for email '${email}'`,
    status: 'success',
    metadata: { email },
  })

  return ok(res, { success: true }, 'OTP sent to your email.')
}

exports.resetPassword = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) {
    return fail(res, 400, 'Token and new password are required')
  }

  const record = await ResetToken.findOne({
    where: {
      token,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  })
  if (!record) return fail(res, 400, 'Invalid or expired reset token')

  const hashed = hashPassword(newPassword)
  await User.update(
    { password_hash: hashed.passwordHash, salt: hashed.salt },
    { where: { email: record.email } }
  )

  await ResetToken.update({ used_at: new Date() }, { where: { token } })

  await logActivity({
    req,
    action: 'RESET_PASSWORD',
    module: 'auth',
    description: `Password reset successfully for email '${record.email}'`,
    status: 'success',
    metadata: { email: record.email },
  })

  return ok(res, { success: true }, 'Password reset successfully.')
}

exports.changePassword = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return fail(res, 400, 'Current and new password are required')
  }

  const userInstance = await UserService.findById(req.user.id)
  const user = userInstance.toJSON()
  if (
    !verifyPassword(currentPassword, {
      passwordHash: user.password_hash,
      salt: user.salt,
    })
  ) {
    return fail(res, 400, 'Current password is incorrect')
  }

  const hashed = hashPassword(newPassword)
  await User.update(
    { password_hash: hashed.passwordHash, salt: hashed.salt },
    { where: { id: req.user.id } }
  )

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CHANGE_PASSWORD',
    module: 'auth',
    description: `User '${user.email || req.user.id}' changed password`,
    status: 'success',
  })

  return ok(res, { success: true }, 'Password changed successfully.')
}

exports.changePasswordWithOtp = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const { email, otp, newPassword } = req.body || {}
  if (!email || !otp || !newPassword) {
    return fail(res, 400, 'Email, OTP and new password are required')
  }

  const record = await PasswordOtp.findOne({
    where: {
      email: cleanEmail(email),
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [['created_at', 'DESC']],
  })

  if (!record) return fail(res, 400, 'Invalid or expired OTP')

  const otpHash = crypto
    .pbkdf2Sync(otp, record.salt, 1000, 64, 'sha512')
    .toString('hex')
  if (otpHash !== record.otp_hash) return fail(res, 400, 'Invalid OTP')

  const hashed = hashPassword(newPassword)
  await User.update(
    { password_hash: hashed.passwordHash, salt: hashed.salt },
    { where: { email: cleanEmail(email) } }
  )

  await PasswordOtp.update(
    { used_at: new Date() },
    { where: { id: record.id } }
  )

  await logActivity({
    req,
    action: 'CHANGE_PASSWORD_OTP',
    module: 'auth',
    description: `Password changed using OTP for email '${email}'`,
    status: 'success',
    metadata: { email },
  })

  return ok(res, { success: true }, 'Password changed successfully.')
}
