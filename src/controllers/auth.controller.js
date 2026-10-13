'use strict'

const AuthService = require('../services/auth.service')
const userModel = require('../models/user.model')
const { ok, created, fail } = require('../utils/response')
const { hashPassword, verifyPassword } = require('../utils/password')
const { makeId } = require('../utils/id')
const { sendMail } = require('../services/mail')
const { env, withTransaction, query, first } = require('../config/db')
const crypto = require('crypto')

const login = async (ctx) => {
  try {
    const session = await AuthService.login(ctx.body)
    return ok(ctx.res, session)
  } catch (err) {
    return fail(ctx.res, err.status || 500, err.message || 'Internal server error')
  }
}

const register = async (ctx) => {
  try {
    const session = await AuthService.register(ctx.body)
    return created(ctx.res, session)
  } catch (err) {
    return fail(ctx.res, err.status || 500, err.message || 'Internal server error')
  }
}

const me = async (ctx) => ok(ctx.res, { user: userModel.toPublicUser(ctx.user) })
const verifyToken = async (ctx) => ok(ctx.res, { valid: true, user: userModel.toPublicUser(ctx.user) })
const verifyEmail = async (ctx) => ok(ctx.res, { success: true, verified: true, token: ctx.body.token || ctx.query.get('token') || null })

const refreshToken = async (ctx) => {
  try {
    const data = await AuthService.refreshToken(ctx.body.refreshToken)
    return ok(ctx.res, data)
  } catch (err) {
    return fail(ctx.res, err.status || 500, err.message || 'Internal server error')
  }
}

const logout = async (ctx) => {
  try {
    const data = await AuthService.logout({
      user: ctx.user,
      tokenPayload: ctx.tokenPayload,
      refreshToken: ctx.body.refreshToken,
    })
    return ok(ctx.res, data)
  } catch (err) {
    return fail(ctx.res, 500, 'Logout failed')
  }
}

const forgotPassword = async (ctx) => {
  const email = userModel.cleanEmail(ctx.body.email)
  if (!email) return fail(ctx.res, 400, 'Email is required')
  const user = await userModel.findByEmail(email)
  if (!user) return fail(ctx.res, 404, 'No account found for this email')

  const resetToken = makeId('reset')
  const otp = String(crypto.randomInt(100000, 999999))
  const hashedOtp = hashPassword(otp)
  await withTransaction(async (connection) => {
    await connection.execute('DELETE FROM reset_tokens WHERE email = ?', [email])
    await connection.execute('DELETE FROM password_otps WHERE email = ?', [email])
    await connection.execute('INSERT INTO reset_tokens (token, email, expires_at) VALUES (?, ?, ?)', [
      resetToken,
      email,
      new Date(Date.now() + 15 * 60 * 1000),
    ])
    await connection.execute('INSERT INTO password_otps (email, otp_hash, salt, expires_at) VALUES (?, ?, ?, ?)', [
      email,
      hashedOtp.passwordHash,
      hashedOtp.salt,
      new Date(Date.now() + 10 * 60 * 1000),
    ])
  })
  await sendMail({
    module: 'admin',
    action: 'forgot-password',
    to: email,
    vars: { name: user.name, appName: env.appName, otp, resetToken },
  })
  return ok(ctx.res, { resetToken, demoOtp: otp, message: 'Reset token and OTP generated' })
}

const requestPasswordOtp = async (ctx) => {
  const email = userModel.cleanEmail(ctx.body.email)
  if (!email) return fail(ctx.res, 400, 'Email is required')
  const user = await userModel.findByEmail(email)
  if (!user) return fail(ctx.res, 404, 'No account found for this email')
  const otp = String(crypto.randomInt(100000, 999999))
  const hashed = hashPassword(otp)
  await query('DELETE FROM password_otps WHERE email = ?', [email])
  await query('INSERT INTO password_otps (email, otp_hash, salt, expires_at) VALUES (?, ?, ?, ?)', [
    email,
    hashed.passwordHash,
    hashed.salt,
    new Date(Date.now() + 10 * 60 * 1000),
  ])
  await sendMail({
    module: 'admin',
    action: 'forgot-password',
    to: email,
    vars: { name: user.name, appName: env.appName, otp },
  })
  return ok(ctx.res, { success: true, demoOtp: otp })
}

const resetPassword = async (ctx) => {
  const { token, email, otp, password } = ctx.body
  if (!password) return fail(ctx.res, 400, 'New password is required')
  let targetEmail = userModel.cleanEmail(email)

  if (token) {
    const reset = await first('SELECT * FROM reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()', [token])
    if (!reset) return fail(ctx.res, 400, 'Reset token is invalid or expired')
    targetEmail = reset.email
  }
  if (otp) {
    const savedOtp = await first('SELECT * FROM password_otps WHERE email = ? AND used_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [targetEmail])
    if (!savedOtp || !verifyPassword(otp, { salt: savedOtp.salt, passwordHash: savedOtp.otp_hash })) {
      return fail(ctx.res, 400, 'OTP is invalid or expired')
    }
    await query('UPDATE password_otps SET used_at = NOW() WHERE id = ?', [savedOtp.id])
  }
  const user = await userModel.findByEmail(targetEmail)
  if (!user) return fail(ctx.res, 404, 'User not found')
  await userModel.changePassword(user.id, hashPassword(password))
  if (token) await query('UPDATE reset_tokens SET used_at = NOW() WHERE token = ?', [token])
  return ok(ctx.res, { success: true })
}

const changePassword = async (ctx) => {
  const { oldPassword, newPassword } = ctx.body
  if (!oldPassword || !newPassword) return fail(ctx.res, 400, 'Old password and new password are required')
  if (!verifyPassword(oldPassword, ctx.user)) return fail(ctx.res, 400, 'Old password is incorrect')
  await userModel.changePassword(ctx.user.id, hashPassword(newPassword))
  return ok(ctx.res, { success: true })
}

const changePasswordWithOtp = async (ctx) => {
  ctx.body = { email: ctx.body.email, otp: ctx.body.otp, password: ctx.body.newPassword }
  return resetPassword(ctx)
}

module.exports = {
  login,
  register,
  me,
  verifyToken,
  verifyEmail,
  refreshToken,
  logout,
  forgotPassword,
  requestPasswordOtp,
  resetPassword,
  changePassword,
  changePasswordWithOtp,
}
