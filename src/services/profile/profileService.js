'use strict'

const {
  User,
  UserProfile,
  Session,
  RevokedToken,
  PasswordOtp,
  ResetToken,
} = require('../../models')
const { cleanEmail, toPublicUser } = require('../../utils/userHelper')
const { makeId } = require('../../utils/id')
const { hashPassword, verifyPassword } = require('../../utils/password')

class UserService {
  static async findByEmail(email) {
    if (!email) return null
    return User.findOne({
      where: { email: cleanEmail(email) },
      include: [{ model: UserProfile, as: 'profile' }],
    })
  }

  static async findById(id) {
    if (!id) return null;
    return User.findOne({
      where: { id },
      include: [{ model: UserProfile, as: "profile" }],
    });
  }

  static async listByRole(role) {
    return User.findAll({
      where: { role },
      include: [{ model: UserProfile, as: "profile" }],
      order: [["created_at", "DESC"]],
    });
  }

  static async updateStatus(userId, status) {
    await User.update({ status }, { where: { id: userId } })
    return this.findById(userId)
  }

  static async updateProfile(userId, data) {
    const userUpdates = {}
    if (data.name) userUpdates.name = data.name
    if (data.avatar_url || data.avatar) userUpdates.avatar_url = data.avatar_url || data.avatar
    if (data.title) userUpdates.title = data.title

    if (Object.keys(userUpdates).length > 0) {
      await User.update(userUpdates, { where: { id: userId } })
    }

    if (data.profile || data.phone || data.city || data.bio) {
      const p = data.profile || data
      await UserProfile.upsert({
        user_id: userId,
        phone: p.phone,
        city: p.city,
        bio: p.bio,
        expertise: p.expertise,
        education: p.education,
        address_line1: p.addressLine1 || p.address_line1,
        address_line2: p.addressLine2 || p.address_line2,
        state: p.state,
        country: p.country,
        pincode: p.pincode,
        metadata: p.metadata,
      })
    }

    return this.findById(userId)
  }
}

module.exports = UserService
