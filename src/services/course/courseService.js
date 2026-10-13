'use strict'

const {
  Course,
  CourseRequirement,
  CourseOutcome,
  CourseMasterOption,
  Lesson,
  LessonTopic,
  User,
  UserProfile,
  Enrollment,
} = require('../../models')
const { makeId } = require('../../utils/id')
const { Op } = require('sequelize')

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const formatCourse = (c) => {
  if (!c) return null
  const plain = typeof c.toJSON === 'function' ? c.toJSON() : c

  const requirements = (plain.requirementsList || []).map((r) => r.requirement_text || r)
  const outcomes = (plain.outcomesList || []).map((o) => o.outcome_text || o)

  return {
    id: plain.id,
    coachId: plain.coach_id,
    title: plain.title,
    slug: plain.slug,
    category: plain.category,
    difficulty: plain.difficulty,
    language: plain.language,
    description: plain.description,
    price: Number(plain.price || 0),
    currency: plain.currency,
    status: plain.status,
    thumbnail: plain.thumbnail_url,
    thumbnailUrl: plain.thumbnail_url,
    promoVideo: plain.promo_video,
    publishedAt: plain.published_at,
    requirements,
    outcomes,
    coach: plain.coach
      ? {
          id: plain.coach.id,
          name: plain.coach.name,
          email: plain.coach.email,
          avatar: plain.coach.avatar_url,
          title: plain.coach.title,
        }
      : null,
    lessons: plain.lessons || [],
    lessonsCount: (plain.lessons || []).length,
    studentsCount: (plain.enrollments || []).length,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  }
}

class CourseService {
  static async listCoachCourses(coachId) {
    const courses = await Course.findAll({
      where: { coach_id: coachId },
      include: [
        { model: CourseRequirement, as: 'requirementsList' },
        { model: CourseOutcome, as: 'outcomesList' },
        { model: Lesson, as: 'lessons' },
        { model: Enrollment, as: 'enrollments', attributes: ['id'] },
      ],
      order: [['created_at', 'DESC']],
    })
    return courses.map(formatCourse)
  }

  static async getCourseDetail(courseId) {
    const course = await Course.findOne({
      where: { [Op.or]: [{ id: courseId }, { slug: courseId }] },
      include: [
        { model: User, as: 'coach', include: [{ model: UserProfile, as: 'profile' }] },
        { model: CourseRequirement, as: 'requirementsList' },
        { model: CourseOutcome, as: 'outcomesList' },
        {
          model: Lesson,
          as: 'lessons',
          include: [{ model: LessonTopic, as: 'topics' }],
        },
        { model: Enrollment, as: 'enrollments', attributes: ['id'] },
      ],
      order: [[{ model: Lesson, as: 'lessons' }, 'sort_order', 'ASC']],
    })
    return formatCourse(course)
  }

  static async listAllCourses(filters = {}) {
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ]
    }

    const courses = await Course.findAll({
      where,
      include: [
        { model: User, as: 'coach' },
        { model: CourseRequirement, as: 'requirementsList' },
        { model: CourseOutcome, as: 'outcomesList' },
        { model: Lesson, as: 'lessons' },
        { model: Enrollment, as: 'enrollments', attributes: ['id'] },
      ],
      order: [['created_at', 'DESC']],
    })
    return courses.map(formatCourse)
  }

  static async browseCourses(studentId, filters = {}) {
    const where = { status: 'published' }
    if (filters.category && filters.category !== 'all') where.category = filters.category
    if (filters.difficulty && filters.difficulty !== 'all') where.difficulty = filters.difficulty
    if (filters.language && filters.language !== 'all') where.language = filters.language
    if (filters.search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ]
    }

    const courses = await Course.findAll({
      where,
      include: [
        { model: User, as: 'coach' },
        { model: CourseRequirement, as: 'requirementsList' },
        { model: CourseOutcome, as: 'outcomesList' },
        { model: Lesson, as: 'lessons' },
        { model: Enrollment, as: 'enrollments', attributes: ['id', 'student_id'] },
      ],
      order: [['created_at', 'DESC']],
    })

    return courses.map((c) => {
      const f = formatCourse(c)
      const isEnrolled = (c.enrollments || []).some((e) => e.student_id === studentId)
      return { ...f, isEnrolled }
    })
  }

  static async createCourse(coachId, body) {
    const courseId = makeId('course')
    const slug = `${slugify(body.title)}-${Date.now().toString().slice(-4)}`

    const course = await Course.create({
      id: courseId,
      coach_id: coachId,
      title: body.title,
      slug,
      category: body.category,
      difficulty: body.difficulty || 'Beginner',
      language: body.language || 'Hinglish',
      description: body.description,
      price: body.price !== undefined ? body.price : 0.0,
      currency: body.currency || 'INR',
      status: body.status || 'draft',
      thumbnail_url: body.thumbnailUrl || body.thumbnail || null,
      promo_video: body.promoVideo || null,
    })

    if (Array.isArray(body.requirements)) {
      for (let i = 0; i < body.requirements.length; i++) {
        await CourseRequirement.create({
          course_id: courseId,
          sort_order: i,
          requirement_text: body.requirements[i],
        })
      }
    }

    if (Array.isArray(body.outcomes)) {
      for (let i = 0; i < body.outcomes.length; i++) {
        await CourseOutcome.create({
          course_id: courseId,
          sort_order: i,
          outcome_text: body.outcomes[i],
        })
      }
    }

    return this.getCourseDetail(courseId)
  }

  static async updateCourse(courseId, coachId, body) {
    const course = await Course.findOne({ where: { id: courseId } })
    if (!course) return null

    const updates = {}
    if (body.title) updates.title = body.title
    if (body.category) updates.category = body.category
    if (body.difficulty) updates.difficulty = body.difficulty
    if (body.language) updates.language = body.language
    if (body.description) updates.description = body.description
    if (body.price !== undefined) updates.price = body.price
    if (body.currency) updates.currency = body.currency
    if (body.status) updates.status = body.status
    if (body.thumbnailUrl !== undefined || body.thumbnail !== undefined) {
      updates.thumbnail_url = body.thumbnailUrl || body.thumbnail
    }
    if (body.promoVideo !== undefined) updates.promo_video = body.promoVideo

    if (Object.keys(updates).length > 0) {
      await Course.update(updates, { where: { id: courseId } })
    }

    if (Array.isArray(body.requirements)) {
      await CourseRequirement.destroy({ where: { course_id: courseId } })
      for (let i = 0; i < body.requirements.length; i++) {
        await CourseRequirement.create({
          course_id: courseId,
          sort_order: i,
          requirement_text: body.requirements[i],
        })
      }
    }

    if (Array.isArray(body.outcomes)) {
      await CourseOutcome.destroy({ where: { course_id: courseId } })
      for (let i = 0; i < body.outcomes.length; i++) {
        await CourseOutcome.create({
          course_id: courseId,
          sort_order: i,
          outcome_text: body.outcomes[i],
        })
      }
    }

    return this.getCourseDetail(courseId)
  }
}

module.exports = CourseService
