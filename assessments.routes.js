// assessments.routes.js - Updated routes
import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import {
  createAssessment,
  updateAssessment,
  deleteAssessment,
  addQuestion,
  deleteQuestion,
  addOption,
  deleteOption,
  getAllAssessments,
  getAssessment,
  submitAssessment,
  getSubmissionResult,
  getCorrectAnswers,
  approveAssessment,
  getAllSubmissions
} from '../controllers/assessments.controller.js';

const router = express.Router();

// ---------- ASSESSMENT CRUD ----------
// Create assessment (teacher creates as pending, admin creates as approved)
router.post('/', requireAuth, authorizeRoles('teacher', 'admin'), createAssessment);

// Update assessment
router.put('/:id', requireAuth, authorizeRoles('teacher', 'admin'), updateAssessment);

// Delete assessment
router.delete('/:id', requireAuth, authorizeRoles('teacher', 'admin'), deleteAssessment);

// Approve/unapprove assessment (admin only)
router.put('/:id/approve', requireAuth, authorizeRoles('admin'), approveAssessment);

// Get all assessments (filtered by query params)
router.get('/', requireAuth, getAllAssessments);

// Get single assessment with questions
router.get('/:id', requireAuth, getAssessment);

// ---------- QUESTION MANAGEMENT ----------
// Add question to assessment
router.post('/:id/questions', requireAuth, authorizeRoles('teacher', 'admin'), addQuestion);

// Delete question
router.delete('/questions/:id', requireAuth, authorizeRoles('teacher', 'admin'), deleteQuestion);

// ---------- OPTION MANAGEMENT ----------
// Add option to question
router.post(
  '/:assessmentId/questions/:questionId/options',
  requireAuth,
  authorizeRoles('teacher', 'admin'),
  addOption
);

// Delete option
router.delete('/options/:id', requireAuth, authorizeRoles('teacher', 'admin'), deleteOption);

// ---------- STUDENT SUBMISSION ----------
// Submit assessment answers
router.post('/:assessmentId/submit', requireAuth, authorizeRoles('student'), submitAssessment);

// Get student's submission result
router.get(
  '/:assessmentId/result',
  requireAuth,
  authorizeRoles('student', 'teacher', 'admin'),
  getSubmissionResult
);

// ---------- TEACHER/ADMIN FEATURES ----------
// Get correct answers
router.get(
  '/:id/correct-answers',
  requireAuth,
  authorizeRoles('teacher', 'admin'),
  getCorrectAnswers
);

// Get all submissions for an assessment
router.get(
  '/:assessmentId/submissions',
  requireAuth,
  authorizeRoles('teacher', 'admin'),
  getAllSubmissions
);

export default router;