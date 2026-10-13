'use strict'

const { Course, User } = require('../../models')
const { ok } = require('../../utils/response')
const { Op } = require('sequelize')

const run = async (ctx) => {
  const query = ctx.query.get('q') || ctx.query.get('query') || ctx.query.get('search') || ''
  if (!query.trim()) {
    return ok(ctx.res, { courses: [], users: [], results: [] })
  }

  const [courses, users] = await Promise.all([
    Course.findAll({
      where: {
        status: 'published',
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { category: { [Op.like]: `%${query}%` } },
        ],
      },
      limit: 10,
    }),
    User.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ],
      },
      attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
      limit: 10,
    }),
  ])

  return ok(ctx.res, { courses, users, results: [...courses, ...users] })
}

module.exports = { run }