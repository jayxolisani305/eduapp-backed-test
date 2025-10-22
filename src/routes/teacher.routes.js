// routes/teacher.js
import express from 'express';
import { requireAuth, isTeacher } from '../middlewares/auth.middleware.js';
import {
  getTeacherStats,
  getTeacherAssessments,
  createTeacherAssessment,
  getAssessmentSubmissions,
  gradeSubmission
} from '../controllers/teacher.controller.js';

const router = express.Router();

// Teacher dashboard routes
router.get('/stats', requireAuth, isTeacher, getTeacherStats);
router.get('/assessments', requireAuth, isTeacher, getTeacherAssessments);
router.post('/assessments', requireAuth, isTeacher, createTeacherAssessment);
router.get('/assessments/:id/submissions', requireAuth, isTeacher, getAssessmentSubmissions);
router.put('/submissions/:id', requireAuth, isTeacher, gradeSubmission);

export default router;