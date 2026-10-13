'use strict'

const { Course, Lesson, LessonTopic } = require('../models/sequelize')
const learningModel = require('../models/learning.model')

class CourseService {
  static async listCoachCourses(coachId) {
    const courseModel = require('../models/course.model')
    return courseModel.listForCoach(coachId)
  }

  static async getCourseDetail(courseId) {
    const courseModel = require('../models/course.model')
    return courseModel.findById(courseId)
  }

  static async createLesson(coachId, data) {
    return learningModel.createLesson(coachId, data)
  }

  static async updateLesson(lessonId, coachId, data) {
    return learningModel.updateLesson(lessonId, coachId, data)
  }

  static async deleteLesson(lessonId, coachId) {
    return learningModel.removeLesson(lessonId, coachId)
  }

  static async listCoachLessons(coachId, filters) {
    return learningModel.listLessonsForCoach(coachId, filters)
  }
}

module.exports = CourseService
