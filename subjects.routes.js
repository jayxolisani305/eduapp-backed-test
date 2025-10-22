// routes/subjects.js
import express from 'express';
import { requireAuth, isAdmin } from '../middlewares/auth.middleware.js';
import {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
  enrollSubject,
  getEnrolledSubjects,
  getStudentSubjects,
  getAvailableSubjects,      // Add this
  getSubjectDetails,         // Add this
  unenrollSubject,           // Add this
  debugUser
} from '../controllers/subjects.controller.js';

const router = express.Router();

// Subjects CRUD - Admin only
router.post('/', requireAuth, isAdmin, createSubject);
router.put('/:id', requireAuth, isAdmin, updateSubject);
router.delete('/:id', requireAuth, isAdmin, deleteSubject);

// View subjects - all logged-in users
router.get('/', requireAuth, getSubjects);

// Enroll
router.post('/enroll', requireAuth, enrollSubject);
router.get('/enrolled', requireAuth, getEnrolledSubjects);
router.get('/student', requireAuth, getStudentSubjects);

// New endpoints
router.get('/available', requireAuth, getAvailableSubjects);
router.get('/:id/details', requireAuth, getSubjectDetails);
router.delete('/enroll/:id', requireAuth, unenrollSubject);
// routes/subjects.js
router.get('/debug', requireAuth, debugUser);
export default router;