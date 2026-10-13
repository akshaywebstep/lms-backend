'use strict'

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
const { Op } = require("sequelize");

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

const me = async (ctx) => ok(ctx.res, { user: toPublicUser(ctx.user) });
const verifyToken = async (ctx) =>
  ok(ctx.res, { valid: true, user: toPublicUser(ctx.user) });
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
  const email = cleanEmail(ctx.body.email);
  if (!email) return fail(ctx.res, 400, 'Email is required')
  const userInstance = await UserService.findByEmail(email);
  if (!userInstance)
    return fail(ctx.res, 404, "No account found for this email");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await ResetToken.create({
    token: resetToken,
    email,
    expires_at: expiresAt,
  });

  await sendMail({
    module: "auth",
    action: "forgot-password",
    to: email,
    vars: {
      name: userInstance.name,
      appName: env.appName,
      loginUrl: `${env.publicUrl}/reset-password?token=${resetToken}`,
    },
  }).catch(() => {});

  return ok(ctx.res, {
    success: true,
    message: "Password reset link sent to your email",
  });
}

const requestPasswordOtp = async (ctx) => {
  const email = cleanEmail(ctx.body.email);
  if (!email) return fail(ctx.res, 400, 'Email is required')
  const userInstance = await UserService.findByEmail(email);
  if (!userInstance)
    return fail(ctx.res, 404, "No account found for this email");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHash = crypto
    .pbkdf2Sync(otp, salt, 1000, 64, "sha512")
    .toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await PasswordOtp.create({
    email,
    otp_hash: otpHash,
    salt,
    expires_at: expiresAt,
  });

  await sendMail({
    module: "auth",
    action: "password-reset-otp",
    to: email,
    vars: {
      name: userInstance.name,
      appName: env.appName,
      otp,
    },
  }).catch(() => {});

  return ok(ctx.res, { success: true, message: "OTP sent to your email" });
}

const resetPassword = async (ctx) => {
  const { token, newPassword } = ctx.body;
  if (!token || !newPassword)
    return fail(ctx.res, 400, "Token and new password are required");

  const record = await ResetToken.findOne({
    where: {
      token,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!record) return fail(ctx.res, 400, "Invalid or expired reset token");

  const hashed = hashPassword(newPassword);
  await User.update(
    { password_hash: hashed.passwordHash, salt: hashed.salt },
    { where: { email: record.email } },
  );

  await ResetToken.update({ used_at: new Date() }, { where: { token } });
  return ok(ctx.res, { success: true, message: "Password reset successfully" });
}

const changePassword = async (ctx) => {
  const { currentPassword, newPassword } = ctx.body;
  if (!currentPassword || !newPassword)
    return fail(ctx.res, 400, "Current and new password are required");

  const userInstance = await UserService.findById(ctx.user.id);
  const user = userInstance.toJSON();
  if (
    !verifyPassword(currentPassword, {
      passwordHash: user.password_hash,
      salt: user.salt,
    })
  ) {
    return fail(ctx.res, 400, "Current password is incorrect");
  }

  const hashed = hashPassword(newPassword);
  await User.update(
    { password_hash: hashed.passwordHash, salt: hashed.salt },
    { where: { id: ctx.user.id } },
  );

  return ok(ctx.res, {
    success: true,
    message: "Password changed successfully",
  });
}

const changePasswordWithOtp = async (ctx) => {
  const { email, otp, newPassword } = ctx.body;
  if (!email || !otp || !newPassword)
    return fail(ctx.res, 400, "Email, OTP and new password are required");

  const record = await PasswordOtp.findOne({
    where: {
      email: cleanEmail(email),
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [["created_at", "DESC"]],
  });

  if (!record) return fail(ctx.res, 400, "Invalid or expired OTP");

  const otpHash = crypto
    .pbkdf2Sync(otp, record.salt, 1000, 64, "sha512")
    .toString("hex");
  if (otpHash !== record.otp_hash) return fail(ctx.res, 400, "Invalid OTP");

  const hashed = hashPassword(newPassword);
  await User.update(
    { password_hash: hashed.passwordHash, salt: hashed.salt },
    { where: { email: cleanEmail(email) } },
  );

  await PasswordOtp.update(
    { used_at: new Date() },
    { where: { id: record.id } },
  );
  return ok(ctx.res, {
    success: true,
    message: "Password changed successfully",
  });
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
