import express from 'express';
import {
  createGroup,
  getGroupsBySubject,
  updateGroup,
  deleteGroup,
  getAllGroups,
  getGroupById,
} from '../controllers/groups.controller.js';
import { requireAuth, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin-only
router.post('/', requireAuth, isAdmin, createGroup);
router.put('/:id', requireAuth, isAdmin, updateGroup);
router.delete('/:id', requireAuth, isAdmin, deleteGroup);

// Public (or all logged-in users)
router.get('/subject/:subject_id', requireAuth, getGroupsBySubject);
router.get('/', requireAuth, getAllGroups);
router.get('/:id', requireAuth, getGroupById);

export default router;
