'use strict'

const { Course, Lesson, LessonTopic, User, CourseRequirement, CourseOutcome } = require('../models')
const courseModel = require('../models/course.model')
const learningModel = require('../models/learning.model')

class CourseService {
  static async listCoachCourses(coachId) {
    return courseModel.listForCoach(coachId)
  }

  static async getCourseDetail(courseId) {
    return courseModel.findById(courseId)
  }

  static async listAllCourses(filters) {
    return courseModel.listAll(filters)
  }

  static async browseCourses(studentId, filters) {
    return courseModel.listForStudent(studentId, filters)
  }

  static async createCourse(coachId, body) {
    return courseModel.create(coachId, body)
  }

  static async updateCourse(courseId, coachId, body) {
    return courseModel.update(courseId, coachId, body)
  }

  // Lessons
  static async listCoachLessons(coachId, filters) {
    return learningModel.listLessonsForCoach(coachId, filters)
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

  // Topics
  static async listCoachTopics(coachId, filters) {
    return learningModel.listTopicsForCoach(coachId, filters)
  }

  static async createTopic(coachId, data) {
    return learningModel.createTopic(coachId, data)
  }

  static async updateTopic(topicId, coachId, data) {
    return learningModel.updateTopic(topicId, coachId, data)
  }

  static async deleteTopic(topicId, coachId) {
    return learningModel.removeTopic(topicId, coachId)
  }
}

module.exports = CourseService
