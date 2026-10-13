'use strict'

const {
  User,
  UserProfile,
  Session,
  RevokedToken,
  PasswordOtp,
  ResetToken,
  Notification,
} = require('../../models')
const UserService = require('../profile/profileService')
const { cleanEmail, toPublicUser } = require('../../utils/userHelper')
const { createToken, readToken } = require('../token')
const { hashPassword, verifyPassword } = require('../../utils/password')
const { sendMail } = require('../mail')
const { makeId } = require('../../utils/id')
const { saveUploadedFile } = require('../upload')
const { ROLES } = require('../../config/constants')
const { env, sequelize } = require('../../config/db')
const crypto = require('crypto')
const { Op } = require("sequelize");

class AuthService {
  static async makeSession(userInstance) {
    const user =
      typeof userInstance.toJSON === "function"
        ? userInstance.toJSON()
        : userInstance;
    const access = createToken(user, "access", env.accessTtlMs);
    const refresh = createToken(user, "refresh", env.refreshTtlMs);

    await Session.create({
      id: makeId("session"),
      user_id: user.id,
      access_token_id: access.tokenId,
      refresh_token_id: refresh.tokenId,
      expires_at: new Date(refresh.payload.exp * 1000),
    });

    return {
      user: toPublicUser(user),
      accessToken: access.token,
      refreshToken: refresh.token,
    };
  }

  static async login({ email, password, role }) {
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }
    const userInstance = await UserService.findByEmail(email);
    if (!userInstance) {
      throw { status: 401, message: "Invalid credentials" };
    }
    const user = userInstance.toJSON();
    if (
      !verifyPassword(password, {
        passwordHash: user.password_hash,
        salt: user.salt,
      })
    ) {
      throw { status: 401, message: "Invalid credentials" };
    }
    if (role && user.role !== role) {
      throw { status: 403, message: `This account is not a ${role}` };
    }
    if (user.status !== "active") {
      throw { status: 403, message: "Your account is not active" };
    }
    return this.makeSession(userInstance);
  }

  static async register(body) {
    if (!body.name || !body.email || !body.password) {
      throw { status: 400, message: "Name, email and password are required" };
    }
    const existing = await UserService.findByEmail(body.email);
    if (existing) {
      throw { status: 409, message: "Email is already registered" };
    }

    const faceImage = body.files?.find(
      (file) => file.fieldName === "faceImage" || file.fieldName === "avatar",
    );
    if (!faceImage) {
      throw { status: 400, message: "Student face image is required" };
    }
    if (!String(faceImage.mimeType || "").startsWith("image/")) {
      throw {
        status: 400,
        message: "Student face image must be an image file",
      };
    }

    const uploaded = saveUploadedFile(faceImage);
    const role = ROLES.STUDENT;
    const hashed = hashPassword(body.password);
    const userId = makeId(role);

    const result = await sequelize.transaction(async (t) => {
      const newUser = await User.create(
        {
          id: userId,
          name: String(body.name).trim(),
          email: cleanEmail(body.email),
          role,
          title: "Learner",
          avatar_url: `${env.publicUrl}${uploaded.url}`,
          password_hash: hashed.passwordHash,
          salt: hashed.salt,
          status: "active",
        },
        { transaction: t },
      );

      await UserProfile.create(
        {
          user_id: userId,
          phone: body.phone || body.profile?.phone || null,
          city: body.city || body.profile?.city || null,
          education: body.education || body.profile?.education || null,
          state: body.state || body.profile?.state || null,
          country: body.country || body.profile?.country || "India",
        },
        { transaction: t },
      );

      return newUser;
    });

    const saved = await UserService.findById(userId);

    await Notification.create({
      id: makeId("notif"),
      type: "account",
      recipient_role: "admin",
      title: "New account registered",
      message: `${saved.name} joined as ${saved.role}.`,
    }).catch(() => {});

    await sendMail({
      module: "student",
      action: "student-registered",
      to: saved.email,
      vars: { name: saved.name, appName: env.appName },
    }).catch(() => {});

    return this.makeSession(saved);
  }

  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { status: 400, message: "Refresh token is required" };
    }
    let payload;
    try {
      payload = readToken(refreshToken);
    } catch (error) {
      throw { status: 401, message: error.message };
    }
    if (payload.type !== "refresh") {
      throw { status: 401, message: "Use a refresh token" };
    }

    const revoked = await RevokedToken.findOne({
      where: { token_id: payload.jti },
    });
    if (revoked) {
      throw { status: 401, message: "Refresh token is invalidated" };
    }

    const userInstance = await UserService.findById(payload.sub);
    if (!userInstance) {
      throw { status: 401, message: "User not found" };
    }

    const access = createToken(
      userInstance.toJSON(),
      "access",
      env.accessTtlMs,
    );
    await Session.create({
      id: makeId("session"),
      user_id: userInstance.id,
      access_token_id: access.tokenId,
      refresh_token_id: payload.jti,
      expires_at: new Date(access.payload.exp * 1000),
    });

    return { accessToken: access.token };
  }

  static async logout({ user, tokenPayload, refreshToken }) {
    if (tokenPayload?.jti) {
      await RevokedToken.create({
        token_id: tokenPayload.jti,
        user_id: user.id,
        expires_at: new Date(tokenPayload.exp * 1000),
      }).catch(() => {});
    }
    if (refreshToken) {
      try {
        const refresh = readToken(refreshToken);
        await RevokedToken.create({
          token_id: refresh.jti,
          user_id: user.id,
          expires_at: new Date(refresh.exp * 1000),
        }).catch(() => {});
      } catch {}
    }
    return { success: true };
  }
}

module.exports = AuthService
