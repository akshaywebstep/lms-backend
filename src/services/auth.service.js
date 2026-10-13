'use strict'

const { User } = require('../models/sequelize')
const userModel = require('../models/user.model')
const sessionModel = require('../models/session.model')
const { createToken, readToken } = require('./token')
const { hashPassword, verifyPassword } = require('../utils/password')
const { sendMail } = require('./mail')
const { makeId } = require('../utils/id')
const { saveUploadedFile } = require('./upload')
const { ROLES } = require('../config/constants')
const { env, withTransaction, query, first } = require('../config/db')
const notificationModel = require('../models/notification.model')
const crypto = require('crypto')

class AuthService {
  static async makeSession(user) {
    const access = createToken(user, 'access', env.accessTtlMs)
    const refresh = createToken(user, 'refresh', env.refreshTtlMs)
    await sessionModel.createSession({
      userId: user.id,
      accessTokenId: access.tokenId,
      refreshTokenId: refresh.tokenId,
      refreshExpiresAt: refresh.payload.exp,
    })
    return {
      user: userModel.toPublicUser(user),
      accessToken: access.token,
      refreshToken: refresh.token,
    }
  }

  static async login({ email, password, role }) {
    if (!email || !password) {
      throw { status: 400, message: 'Email and password are required' }
    }
    const user = await userModel.findByEmail(email)
    if (!user || !verifyPassword(password, user)) {
      throw { status: 401, message: 'Invalid credentials' }
    }
    if (role && user.role !== role) {
      throw { status: 403, message: `This account is not a ${role}` }
    }
    if (user.status !== 'active') {
      throw { status: 403, message: 'Your account is not active' }
    }
    return this.makeSession(user)
  }

  static async register(body) {
    if (!body.name || !body.email || !body.password) {
      throw { status: 400, message: 'Name, email and password are required' }
    }
    if (await userModel.findByEmail(body.email)) {
      throw { status: 409, message: 'Email is already registered' }
    }

    const faceImage = body.files?.find((file) => file.fieldName === 'faceImage' || file.fieldName === 'avatar')
    if (!faceImage) {
      throw { status: 400, message: 'Student face image is required' }
    }
    if (!String(faceImage.mimeType || '').startsWith('image/')) {
      throw { status: 400, message: 'Student face image must be an image file' }
    }

    const uploaded = saveUploadedFile(faceImage)
    const role = ROLES.STUDENT
    const hashed = hashPassword(body.password)
    const user = {
      id: makeId(role),
      name: String(body.name).trim(),
      email: userModel.cleanEmail(body.email),
      role,
      title: 'Learner',
      avatar: `${env.publicUrl}${uploaded.url}`,
      passwordHash: hashed.passwordHash,
      salt: hashed.salt,
    }
    const profile = {
      ...(body.profile && typeof body.profile === 'object' ? body.profile : {}),
      phone: body.phone || body.profile?.phone,
      city: body.city || body.profile?.city,
      education: body.education || body.profile?.education,
      state: body.state || body.profile?.state,
      country: body.country || body.profile?.country || 'India',
    }

    await withTransaction(async (connection) => userModel.create(connection, user, profile))
    const saved = await userModel.findById(user.id)
    await notificationModel.create({
      recipientRole: ROLES.ADMIN,
      title: 'New account registered',
      message: `${saved.name} joined as ${saved.role}.`,
    })

    await sendMail({
      module: 'student',
      action: 'student-registered',
      to: saved.email,
      vars: { name: saved.name, appName: env.appName },
    })

    return this.makeSession(saved)
  }

  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { status: 400, message: 'Refresh token is required' }
    }
    let payload
    try {
      payload = readToken(refreshToken)
    } catch (error) {
      throw { status: 401, message: error.message }
    }
    if (payload.type !== 'refresh') {
      throw { status: 401, message: 'Use a refresh token' }
    }
    if (await sessionModel.isRevoked(payload.jti)) {
      throw { status: 401, message: 'Refresh token is invalidated' }
    }

    const user = await userModel.findById(payload.sub)
    if (!user) {
      throw { status: 401, message: 'User not found' }
    }

    const access = createToken(user, 'access', env.accessTtlMs)
    await sessionModel.createSession({
      userId: user.id,
      accessTokenId: access.tokenId,
      refreshTokenId: payload.jti,
      refreshExpiresAt: access.payload.exp,
    })

    return { accessToken: access.token }
  }

  static async logout({ user, tokenPayload, refreshToken }) {
    await sessionModel.revokeToken({
      tokenId: tokenPayload.jti,
      userId: user.id,
      expiresAt: tokenPayload.exp,
    })
    if (refreshToken) {
      try {
        const refresh = readToken(refreshToken)
        await sessionModel.revokeToken({ tokenId: refresh.jti, userId: user.id, expiresAt: refresh.exp })
      } catch {}
    }
    return { success: true }
  }
}

module.exports = AuthService
