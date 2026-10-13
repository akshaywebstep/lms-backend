'use strict'

const {
  Lesson,
  LessonTopic,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Enrollment,
  LessonProgress,
  Certificate,
  Course,
  User,
  Upload,
} = require('../../models')
const { makeId } = require('../../utils/id')
const { Op } = require('sequelize')

class LearningService {
  // Lessons
  static async listLessonsForCoach(coachId, { courseId } = {}) {
    const where = {}
    if (courseId) where.course_id = courseId

    const lessons = await Lesson.findAll({
      where,
      include: [
        {
          model: Course,
          as: 'course',
          where: { coach_id: coachId },
          attributes: ['id', 'title'],
        },
        { model: LessonTopic, as: 'topics' },
      ],
      order: [['sort_order', 'ASC']],
    })

    return lessons.map((l) => ({
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      description: l.description,
      contentType: l.content_type,
      contentUrl: l.content_url,
      durationMinutes: l.duration_minutes,
      isPreview: Boolean(l.is_preview),
      sortOrder: l.sort_order,
      dripDays: l.drip_days,
      status: l.status,
      topics: l.topics || [],
      course: l.course,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }))
  }

  static async createLesson(coachId, body) {
    const course = await Course.findOne({ where: { id: body.courseId, coach_id: coachId } })
    if (!course) return null

    const lessonId = makeId('lesson')
    const count = await Lesson.count({ where: { course_id: body.courseId } })

    const lesson = await Lesson.create({
      id: lessonId,
      course_id: body.courseId,
      title: body.title,
      description: body.description || null,
      content_type: body.contentType || 'video',
      content_url: body.contentUrl || null,
      duration_minutes: body.durationMinutes || 0,
      is_preview: Boolean(body.isPreview),
      sort_order: body.sortOrder !== undefined ? body.sortOrder : count + 1,
      drip_days: body.dripDays || 0,
      status: body.status || 'published',
    })

    return {
      id: lesson.id,
      courseId: lesson.course_id,
      title: lesson.title,
      description: lesson.description,
      contentType: lesson.content_type,
      contentUrl: lesson.content_url,
      durationMinutes: lesson.duration_minutes,
      isPreview: Boolean(lesson.is_preview),
      sortOrder: lesson.sort_order,
      dripDays: lesson.drip_days,
      status: lesson.status,
    }
  }

  static async updateLesson(lessonId, coachId, body) {
    const lesson = await Lesson.findOne({
      where: { id: lessonId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!lesson) return null

    const updates = {}
    if (body.title) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.contentType) updates.content_type = body.contentType
    if (body.contentUrl !== undefined) updates.content_url = body.contentUrl
    if (body.durationMinutes !== undefined) updates.duration_minutes = body.durationMinutes
    if (body.isPreview !== undefined) updates.is_preview = Boolean(body.isPreview)
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
    if (body.dripDays !== undefined) updates.drip_days = body.dripDays
    if (body.status) updates.status = body.status

    await Lesson.update(updates, { where: { id: lessonId } })
    return Lesson.findByPk(lessonId)
  }

  static async removeLesson(lessonId, coachId) {
    const lesson = await Lesson.findOne({
      where: { id: lessonId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!lesson) return false
    await Lesson.destroy({ where: { id: lessonId } })
    return true
  }

  // Topics
  static async listTopicsForCoach(coachId, { lessonId, courseId } = {}) {
    const lessonWhere = {}
    if (lessonId) lessonWhere.id = lessonId

    const topics = await LessonTopic.findAll({
      include: [
        {
          model: Lesson,
          as: 'lesson',
          where: lessonWhere,
          include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
        },
      ],
      order: [['sort_order', 'ASC']],
    })

    return topics.map((t) => ({
      id: t.id,
      lessonId: t.lesson_id,
      title: t.title,
      body: t.body,
      sortOrder: t.sort_order,
      lessonTitle: t.lesson?.title,
    }))
  }

  static async createTopic(coachId, body) {
    const lesson = await Lesson.findOne({
      where: { id: body.lessonId },
      include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
    })
    if (!lesson) return null

    const topicId = makeId('topic')
    const count = await LessonTopic.count({ where: { lesson_id: body.lessonId } })

    const topic = await LessonTopic.create({
      id: topicId,
      lesson_id: body.lessonId,
      title: body.title || body.name,
      body: body.body || body.content || null,
      sort_order: body.sortOrder !== undefined ? body.sortOrder : count + 1,
    })

    return {
      id: topic.id,
      lessonId: topic.lesson_id,
      title: topic.title,
      body: topic.body,
      sortOrder: topic.sort_order,
    }
  }

  static async updateTopic(topicId, coachId, body) {
    const topic = await LessonTopic.findOne({
      where: { id: topicId },
      include: [
        {
          model: Lesson,
          as: 'lesson',
          include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
        },
      ],
    })
    if (!topic) return null

    const updates = {}
    if (body.title || body.name) updates.title = body.title || body.name
    if (body.body !== undefined || body.content !== undefined) updates.body = body.body || body.content
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder

    await LessonTopic.update(updates, { where: { id: topicId } })
    return LessonTopic.findByPk(topicId)
  }

  static async removeTopic(topicId, coachId) {
    const topic = await LessonTopic.findOne({
      where: { id: topicId },
      include: [
        {
          model: Lesson,
          as: 'lesson',
          include: [{ model: Course, as: 'course', where: { coach_id: coachId } }],
        },
      ],
    })
    if (!topic) return false
    await LessonTopic.destroy({ where: { id: topicId } })
    return true
  }

  // Student Course Content & Progress
  static async getStudentCourseContent(studentId, courseId) {
    const enrollment = await Enrollment.findOne({
      where: { student_id: studentId, course_id: courseId },
    })

    const course = await Course.findOne({
      where: { id: courseId },
      include: [
        {
          model: Lesson,
          as: 'lessons',
          include: [
            { model: LessonTopic, as: 'topics' },
            { model: Quiz, as: 'quizzes' },
            { model: Assignment, as: 'assignments' },
          ],
        },
      ],
      order: [[{ model: Lesson, as: 'lessons' }, 'sort_order', 'ASC']],
    })

    if (!course) return null

    let progressRecords = []
    if (enrollment) {
      progressRecords = await LessonProgress.findAll({
        where: { enrollment_id: enrollment.id },
      })
    }

    const progressMap = {}
    progressRecords.forEach((p) => {
      progressMap[p.lesson_id] = p.status
    })

    const enrolledDate = enrollment ? new Date(enrollment.enrolled_at || enrollment.created_at) : null
    const nowTime = Date.now()

    const plain = course.toJSON()
    plain.lessons = (plain.lessons || []).map((l) => {
      let isLocked = !enrollment && !l.is_preview
      let unlocksAt = null

      if (enrollment && Number(l.drip_days) > 0 && enrolledDate) {
        const unlockMs = enrolledDate.getTime() + (Number(l.drip_days) * 24 * 60 * 60 * 1000)
        unlocksAt = new Date(unlockMs)
        if (nowTime < unlockMs) {
          isLocked = true
        }
      }

      return {
        ...l,
        dripDays: l.drip_days,
        unlocksAt,
        isLocked,
        progressStatus: progressMap[l.id] || 'not_started',
        progress: { status: progressMap[l.id] || 'not_started' },
      }
    })

    return {
      course: plain,
      lessons: plain.lessons,
      enrollment: enrollment ? enrollment.toJSON() : null,
      isEnrolled: Boolean(enrollment),
    }
  }

  static async updateStudentLessonProgress(studentId, lessonId, body) {
    const lesson = await Lesson.findByPk(lessonId)
    if (!lesson) return null

    const enrollment = await Enrollment.findOne({
      where: { student_id: studentId, course_id: lesson.course_id },
    })
    if (!enrollment) return null

    // Enforce drip days lock
    if (Number(lesson.drip_days) > 0) {
      const enrolledDate = new Date(enrollment.enrolled_at || enrollment.created_at)
      const unlockMs = enrolledDate.getTime() + (Number(lesson.drip_days) * 24 * 60 * 60 * 1000)
      if (Date.now() < unlockMs) {
        const error = new Error(`This lesson is locked until ${new Date(unlockMs).toDateString()}`)
        error.status = 403
        throw error
      }
    }

    const status = body.status || 'completed'
    const watchedSeconds = body.watchedSeconds || 0

    const [record] = await LessonProgress.findOrCreate({
      where: { enrollment_id: enrollment.id, lesson_id: lessonId },
      defaults: {
        status,
        watched_seconds: watchedSeconds,
        completed_at: status === 'completed' ? new Date() : null,
      },
    })

    if (record) {
      await record.update({
        status,
        watched_seconds: watchedSeconds,
        completed_at: status === 'completed' ? new Date() : record.completed_at,
      })
    }

    // Recalculate total course progress
    const totalLessons = await Lesson.count({ where: { course_id: lesson.course_id } })
    const completedLessons = await LessonProgress.count({
      where: { enrollment_id: enrollment.id, status: 'completed' },
    })

    const pct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 100
    await enrollment.update({
      progress: pct,
      status: pct >= 100 ? 'completed' : enrollment.status,
      completed_at: pct >= 100 ? new Date() : enrollment.completed_at,
    })

    return { progress: pct, status: record.status }
  }
}

module.exports = LearningService
