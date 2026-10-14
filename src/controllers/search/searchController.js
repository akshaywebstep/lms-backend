const { Course, User } = require('../../models')
const { ok } = require('../../utils/response')
const { Op } = require('sequelize')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

exports.run = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const query =
    req.query?.q ||
    req.query?.query ||
    req.query?.search ||
    (typeof req.query?.get === 'function' ? req.query.get('q') || req.query.get('query') || req.query.get('search') : '') ||
    ''

  if (!String(query).trim()) {
    return ok(res, { courses: [], users: [], results: [] }, 'Search completed.')
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

  return ok(res, { courses, users, results: [...courses, ...users] }, 'Search completed successfully.')
}