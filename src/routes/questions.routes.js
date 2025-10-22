import express from 'express';
import { requireAuth, isAdmin, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  createSuggestedQuestion,
  getSuggestedQuestions,
  approveSuggestedQuestion,
  deleteSuggestedQuestion
} from '../controllers/questions.controller.js';

const router = express.Router();

// Suggest a question (students)
router.post('/suggest', requireAuth, createSuggestedQuestion);

// List all suggestions (admin, teacher)
router.get('/suggested', requireAuth, authorizeRoles('admin', 'teacher'), getSuggestedQuestions);

// Approve suggestion (admin, teacher)
router.post('/suggested/:id/approve', requireAuth, authorizeRoles('admin', 'teacher'), approveSuggestedQuestion);

// Delete suggestion (admin, teacher)
router.delete('/suggested/:id', requireAuth, authorizeRoles('admin', 'teacher'), deleteSuggestedQuestion);

export default router;
