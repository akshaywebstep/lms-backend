'use strict'

const { User, UserProfile } = require('../models/sequelize')
const userModel = require('../models/user.model')
const { cleanEmail, toPublicUser } = userModel

class UserService {
  static async findByEmail(email) {
    const user = await User.findOne({
      where: { email: cleanEmail(email) },
      include: [{ model: UserProfile, as: 'profile' }],
    })
    if (!user) return null
    return userModel.mapUser({
      ...user.toJSON(),
      ...(user.profile ? user.profile.toJSON() : {}),
      password_hash: user.password_hash,
      salt: user.salt,
      avatar_url: user.avatar_url,
    })
  }

  static async findById(id) {
    const user = await User.findOne({
      where: { id },
      include: [{ model: UserProfile, as: 'profile' }],
    })
    if (!user) return null
    return userModel.mapUser({
      ...user.toJSON(),
      ...(user.profile ? user.profile.toJSON() : {}),
      password_hash: user.password_hash,
      salt: user.salt,
      avatar_url: user.avatar_url,
    })
  }

  static async listByRole(role) {
    const users = await User.findAll({
      where: { role },
      include: [{ model: UserProfile, as: 'profile' }],
      order: [['created_at', 'DESC']],
    })
    return users.map((u) => {
      const mapped = userModel.mapUser({
        ...u.toJSON(),
        ...(u.profile ? u.profile.toJSON() : {}),
        password_hash: u.password_hash,
        salt: u.salt,
        avatar_url: u.avatar_url,
      })
      return toPublicUser(mapped)
    })
  }

  static async updateStatus(userId, status) {
    await User.update({ status }, { where: { id: userId } })
    return this.findById(userId)
  }

  static async updateProfile(userId, body) {
    return userModel.updateProfile(userId, body)
  }
}

module.exports = UserService
