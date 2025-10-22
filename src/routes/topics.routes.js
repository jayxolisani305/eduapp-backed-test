import express from 'express';
import { requireAuth, isAdmin } from '../middlewares/auth.middleware.js';
import {
  createTopic,
  getAllTopics,
  updateTopic,
  deleteTopic,
  getTopicById,
  getTopicsBySubjectId,
  createManyTopics,
  getEnrolledTopics,
  getEnrolledAssessments,
  getTopicsAndAssessments
} from '../controllers/topics.controller.js';

const router = express.Router();

// Admin-only
router.post('/', requireAuth, isAdmin, createTopic);
router.post('/bulk', requireAuth, isAdmin, createManyTopics);
router.put('/:id', requireAuth, isAdmin, updateTopic);
router.delete('/:id', requireAuth, isAdmin, deleteTopic);
router.get('/:id', requireAuth, isAdmin, getTopicById);

// Public/student
router.get('/', requireAuth, getAllTopics);
router.get('/subject/:subjectId', requireAuth, getTopicsBySubjectId);
router.get('/subjects/:subject_id/details', requireAuth, getTopicsAndAssessments);
router.get('/topics', requireAuth, getEnrolledTopics);
router.get('/assessments', requireAuth, getEnrolledAssessments);

export default router;
