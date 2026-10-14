const { ok, created, fail } = require('../../utils/response')
const LearningService = require('../../services/learning/learning.service')
const AssessmentService = require('../../services/learning/assessment.service')
const { Certificate, Upload } = require('../../models')
const { makeId } = require('../../utils/id')
const { logActivity } = require('../../services/activity/activityLogService')

const getReqRes = (a, b) => {
  if (!b && a?.res) return { req: a.req || a, res: a.res }
  return { req: a, res: b }
}

const getQuery = (req, key) => {
  if (req.query && req.query[key] !== undefined) return req.query[key]
  if (typeof req.query?.get === 'function') return req.query.get(key)
  return null
}

// Lessons
exports.listCoachLessons = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const courseId = getQuery(req, 'courseId')
  const lessons = await LearningService.listLessonsForCoach(req.user.id, { courseId })
  return ok(res, { lessons }, 'Coach lessons fetched successfully.')
}

exports.getCoachLesson = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const isPrivileged = req.user?.role === 'super_admin' || req.user?.role === 'admin'
  const lesson = await LearningService.getLessonDetail(req.params.id, isPrivileged ? null : req.user?.id)
  if (!lesson) return fail(res, 404, 'Lesson not found')
  return ok(res, { lesson }, 'Lesson details fetched successfully.')
}

exports.createCoachLesson = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.courseId || !req.body?.title) return fail(res, 400, 'Course and lesson title are required')
  const lesson = await LearningService.createLesson(req.user.id, req.body)
  if (!lesson) return fail(res, 404, 'Course not found for this coach')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_LESSON',
    module: 'lessons',
    description: `Coach created lesson '${lesson.title || req.body.title}'`,
    status: 'success',
    metadata: { lessonId: lesson.id, courseId: req.body.courseId, title: lesson.title },
  })

  return created(res, { lesson }, 'Lesson created successfully.')
}

exports.updateCoachLesson = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const lesson = await LearningService.updateLesson(req.params.id, req.user.id, req.body)
  if (!lesson) return fail(res, 404, 'Lesson not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'UPDATE_LESSON',
    module: 'lessons',
    description: `Coach updated lesson '${lesson.title || req.params.id}'`,
    status: 'success',
    metadata: { lessonId: req.params.id },
  })

  return ok(res, { lesson }, 'Lesson updated successfully.')
}

exports.deleteCoachLesson = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const removed = await LearningService.removeLesson(req.params.id, req.user.id)
  if (!removed) return fail(res, 404, 'Lesson not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_LESSON',
    module: 'lessons',
    description: `Coach deleted lesson ID ${req.params.id}`,
    status: 'success',
    metadata: { lessonId: req.params.id },
  })

  return ok(res, { success: true }, 'Lesson deleted successfully.')
}

// Topics
exports.listCoachTopics = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const lessonId = getQuery(req, 'lessonId')
  const courseId = getQuery(req, 'courseId')
  const topics = await LearningService.listTopicsForCoach(req.user.id, { lessonId, courseId })
  return ok(res, { topics }, 'Coach topics fetched successfully.')
}

exports.createCoachTopic = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.lessonId || !(req.body?.title || req.body?.name)) {
    return fail(res, 400, 'Lesson and topic title are required')
  }
  const topic = await LearningService.createTopic(req.user.id, req.body)
  if (!topic) return fail(res, 404, 'Lesson not found for this coach')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_TOPIC',
    module: 'topics',
    description: `Coach created topic '${topic.title || topic.name || req.body.title}'`,
    status: 'success',
    metadata: { topicId: topic.id, lessonId: req.body.lessonId },
  })

  return created(res, { topic }, 'Topic created successfully.')
}

exports.updateCoachTopic = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const topic = await LearningService.updateTopic(req.params.id, req.user.id, req.body)
  if (!topic) return fail(res, 404, 'Topic not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'UPDATE_TOPIC',
    module: 'topics',
    description: `Coach updated topic '${topic.title || topic.name || req.params.id}'`,
    status: 'success',
    metadata: { topicId: req.params.id },
  })

  return ok(res, { topic }, 'Topic updated successfully.')
}

exports.deleteCoachTopic = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const removed = await LearningService.removeTopic(req.params.id, req.user.id)
  if (!removed) return fail(res, 404, 'Topic not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_TOPIC',
    module: 'topics',
    description: `Coach deleted topic ID ${req.params.id}`,
    status: 'success',
    metadata: { topicId: req.params.id },
  })

  return ok(res, { success: true }, 'Topic deleted successfully.')
}

// Quizzes
exports.listCoachQuizzes = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const courseId = getQuery(req, 'courseId')
  const quizzes = await AssessmentService.listQuizzesForCoach(req.user.id, { courseId })
  return ok(res, { quizzes }, 'Coach quizzes fetched successfully.')
}

exports.getCoachQuiz = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const quiz = await AssessmentService.getQuizDetail(req.params.id)
  if (!quiz) return fail(res, 404, 'Quiz not found')
  return ok(res, { quiz }, 'Quiz details fetched successfully.')
}

exports.createCoachQuiz = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  if (!req.body?.courseId || !req.body?.title) return fail(res, 400, 'Course ID and quiz title are required')
  const quiz = await AssessmentService.createQuiz(req.user.id, req.body)
  if (!quiz) return fail(res, 404, 'Course not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'CREATE_QUIZ',
    module: 'quizzes',
    description: `Coach created quiz '${quiz.title || req.body.title}'`,
    status: 'success',
    metadata: { quizId: quiz.id, courseId: req.body.courseId },
  })

  return created(res, { quiz }, 'Quiz created successfully.')
}

exports.updateCoachQuiz = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const quiz = await AssessmentService.updateQuiz(req.params.id, req.user.id, req.body)
  if (!quiz) return fail(res, 404, 'Quiz not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'UPDATE_QUIZ',
    module: 'quizzes',
    description: `Coach updated quiz '${quiz.title || req.params.id}'`,
    status: 'success',
    metadata: { quizId: req.params.id },
  })

  return ok(res, { quiz }, 'Quiz updated successfully.')
}

exports.deleteCoachQuiz = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const removed = await AssessmentService.removeQuiz(req.params.id, req.user.id)
  if (!removed) return fail(res, 404, 'Quiz not found')

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_QUIZ',
    module: 'quizzes',
    description: `Coach deleted quiz ID ${req.params.id}`,
    status: 'success',
    metadata: { quizId: req.params.id },
  })

  return ok(res, { success: true }, 'Quiz deleted successfully.')
}

// Materials
exports.listCoachMaterials = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const uploads = await Upload.findAll({
    where: { owner_id: req.user.id },
    order: [['created_at', 'DESC']],
  })
  return ok(res, { materials: uploads, uploads }, 'Materials fetched successfully.')
}

exports.createCoachMaterial = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const upload = await Upload.create({
    id: makeId('mat'),
    owner_id: req.user.id,
    file_type: req.body?.fileType || 'document',
    original_name: req.body?.originalName || 'file',
    file_url: req.body?.fileUrl,
    mime_type: req.body?.mimeType || 'application/octet-stream',
    size_bytes: req.body?.sizeBytes || 0,
  })

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'UPLOAD_MATERIAL',
    module: 'materials',
    description: `Coach uploaded learning material '${upload.original_name}'`,
    status: 'success',
    metadata: { uploadId: upload.id, fileType: upload.file_type },
  })

  return created(res, { material: upload, upload }, 'Material uploaded successfully.')
}

exports.deleteCoachMaterial = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  await Upload.destroy({ where: { id: req.params.id, owner_id: req.user.id } })

  await logActivity({
    req,
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_MATERIAL',
    module: 'materials',
    description: `Coach deleted learning material ID ${req.params.id}`,
    status: 'success',
    metadata: { uploadId: req.params.id },
  })

  return ok(res, { success: true }, 'Material deleted successfully.')
}

// Student Learning
exports.studentCourseContent = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const content = await LearningService.getStudentCourseContent(req.user.id, req.params.courseId)
  if (!content) return fail(res, 404, 'Course not found')
  return ok(res, content, 'Student course content fetched.')
}

exports.updateStudentLessonProgress = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const result = await LearningService.updateStudentLessonProgress(req.user.id, req.params.id, req.body)
    if (!result) return fail(res, 404, 'Lesson or enrollment not found')

    await logActivity({
      req,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_PROGRESS',
      module: 'learning',
      description: `Student updated progress on lesson ID ${req.params.id}`,
      status: 'success',
      metadata: { lessonId: req.params.id, status: req.body?.status, progress: req.body?.progress },
    })

    return ok(res, result, 'Lesson progress updated successfully.')
  } catch (err) {
    return fail(res, err.status || 400, err.message || 'Progress update failed')
  }
}

exports.listStudentQuizzes = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const quizzes = await AssessmentService.listStudentQuizzes(req.user.id)
  return ok(res, { quizzes }, 'Student quizzes fetched successfully.')
}

exports.attemptStudentQuiz = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const attempt = await AssessmentService.attemptStudentQuiz(req.user.id, req.params.id, req.body)
    if (!attempt) return fail(res, 404, 'Quiz or enrollment not found')

    await logActivity({
      req,
      userId: req.user.id,
      role: req.user.role,
      action: 'ATTEMPT_QUIZ',
      module: 'quizzes',
      description: `Student attempted quiz ID ${req.params.id} (Score: ${attempt.score ?? 'N/A'})`,
      status: 'success',
      metadata: { quizId: req.params.id, score: attempt.score, passed: attempt.passed },
    })

    return ok(res, { attempt }, 'Quiz attempt processed successfully.')
  } catch (err) {
    return fail(res, err.status || 400, err.message || 'Quiz attempt failed')
  }
}

exports.listStudentAssignments = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const assignments = await AssessmentService.listStudentAssignments(req.user.id)
  return ok(res, { assignments }, 'Student assignments fetched successfully.')
}

exports.submitStudentAssignment = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  try {
    const submission = await AssessmentService.submitStudentAssignment(req.user.id, req.params.id, req.body)
    if (!submission) return fail(res, 404, 'Assignment or enrollment not found')

    await logActivity({
      req,
      userId: req.user.id,
      role: req.user.role,
      action: 'SUBMIT_ASSIGNMENT',
      module: 'assignments',
      description: `Student submitted assignment ID ${req.params.id}`,
      status: 'success',
      metadata: { assignmentId: req.params.id, submissionId: submission.id },
    })

    return created(res, { submission }, 'Assignment submitted successfully.')
  } catch (err) {
    return fail(res, err.status || 400, err.message || 'Assignment submission failed')
  }
}

exports.listStudentCertificates = async (rawReq, rawRes) => {
  const { req, res } = getReqRes(rawReq, rawRes)
  const certs = await Certificate.findAll({
    where: { student_id: req.user.id },
    order: [['issued_at', 'DESC']],
  })
  return ok(res, { certificates: certs }, 'Student certificates fetched successfully.')
}
