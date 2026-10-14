
const { CourseMasterOption, User, Course } = require('../../models')
const { makeId } = require('../../utils/id')

exports.listPublic = async () => {
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

exports.listAdminAll = async () => {
  const [options, courses] = await Promise.all([
    CourseMasterOption.findAll({
      include: [{ model: User, as: 'creator' }],
      order: [['created_at', 'DESC']],
    }),
    Course.findAll({
      attributes: ['category_id', 'difficulty_id', 'language_id', 'category', 'difficulty', 'language'],
    }),
  ])

  const usageCounts = {}
  courses.forEach((c) => {
    if (c.category_id) usageCounts[c.category_id] = (usageCounts[c.category_id] || 0) + 1
    if (c.difficulty_id) usageCounts[c.difficulty_id] = (usageCounts[c.difficulty_id] || 0) + 1
    if (c.language_id) usageCounts[c.language_id] = (usageCounts[c.language_id] || 0) + 1
    if (c.category) usageCounts[`name:${c.category.trim().toLowerCase()}`] = (usageCounts[`name:${c.category.trim().toLowerCase()}`] || 0) + 1
    if (c.difficulty) usageCounts[`name:${c.difficulty.trim().toLowerCase()}`] = (usageCounts[`name:${c.difficulty.trim().toLowerCase()}`] || 0) + 1
    if (c.language) usageCounts[`name:${c.language.trim().toLowerCase()}`] = (usageCounts[`name:${c.language.trim().toLowerCase()}`] || 0) + 1
  })

  const categories = []
  const difficulties = []
  const languages = []

  options.forEach((opt) => {
    const count = usageCounts[opt.id] || usageCounts[`name:${(opt.name || '').trim().toLowerCase()}`] || 0
    const creatorObj = opt.creator
      ? {
          id: opt.creator.id,
          name: opt.creator.name,
          email: opt.creator.email,
          role: opt.creator.role,
          avatar: opt.creator.avatar_url,
        }
      : null

    const item = {
      id: opt.id,
      name: opt.name,
      type: opt.type,
      status: opt.status,
      creatorRole: opt.creator_role,
      createdBy: creatorObj,
      createdById: opt.created_by,
      usedCourses: count,
      createdAt: opt.created_at,
      updatedAt: opt.updated_at,
    }
    if (opt.type === 'category') categories.push(item)
    else if (opt.type === 'difficulty') difficulties.push(item)
    else if (opt.type === 'language') languages.push(item)
  })

  return { categories, difficulties, languages }
}

exports.listAdmin = async (type) => {
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

exports.create = async (type, data, creatorRole = 'superadmin', createdBy = null) => {
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

exports.update = async (type, id, data) => {
  const option = await CourseMasterOption.findOne({ where: { id, type } })
  if (!option) return null

  const updates = {}
  if (data.name) updates.name = data.name
  if (data.status) updates.status = data.status

  await CourseMasterOption.update(updates, { where: { id } })
  return CourseMasterOption.findByPk(id)
}

exports.delete = async (type, id) => {
  const option = await CourseMasterOption.findOne({ where: { id, type } })
  if (!option) return false
  await CourseMasterOption.destroy({ where: { id } })
  return true
}
