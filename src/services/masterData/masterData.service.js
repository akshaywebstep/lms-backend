'use strict'

const { CourseMasterOption, User } = require('../../models')
const { makeId } = require('../../utils/id')
const { Op } = require('sequelize')

class MasterDataService {
  static async listPublic() {
    const options = await CourseMasterOption.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']],
    })

    const categories = []
    const difficulties = []
    const languages = []

    options.forEach((opt) => {
      const item = { id: opt.id, name: opt.name, type: opt.type }
      if (opt.type === 'category') categories.push(item)
      else if (opt.type === 'difficulty') difficulties.push(item)
      else if (opt.type === 'language') languages.push(item)
    })

    return { categories, difficulties, languages }
  }

  static async listAdminAll() {
    const options = await CourseMasterOption.findAll({
      order: [['created_at', 'DESC']],
    })

    const categories = []
    const difficulties = []
    const languages = []

    options.forEach((opt) => {
      const item = {
        id: opt.id,
        name: opt.name,
        type: opt.type,
        status: opt.status,
        creatorRole: opt.creator_role,
        createdBy: opt.created_by,
        createdAt: opt.created_at,
        updatedAt: opt.updated_at,
      }
      if (opt.type === 'category') categories.push(item)
      else if (opt.type === 'difficulty') difficulties.push(item)
      else if (opt.type === 'language') languages.push(item)
    })

    return { categories, difficulties, languages }
  }

  static async listAdmin(type) {
    const options = await CourseMasterOption.findAll({
      where: { type },
      order: [['name', 'ASC']],
    })
    return options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      type: opt.type,
      status: opt.status,
      creatorRole: opt.creator_role,
      createdBy: opt.created_by,
      createdAt: opt.created_at,
      updatedAt: opt.updated_at,
    }))
  }

  static async create(type, data, creatorRole = 'superadmin', createdBy = null) {
    const id = makeId('m_opt')
    return CourseMasterOption.create({
      id,
      type,
      name: data.name,
      status: data.status || 'active',
      creator_role: creatorRole,
      created_by: createdBy,
    })
  }

  static async update(type, id, data) {
    const option = await CourseMasterOption.findOne({ where: { id, type } })
    if (!option) return null

    const updates = {}
    if (data.name) updates.name = data.name
    if (data.status) updates.status = data.status

    await CourseMasterOption.update(updates, { where: { id } })
    return CourseMasterOption.findByPk(id)
  }

  static async delete(type, id) {
    const option = await CourseMasterOption.findOne({ where: { id, type } })
    if (!option) return false
    await CourseMasterOption.destroy({ where: { id } })
    return true
  }
}

module.exports = MasterDataService
