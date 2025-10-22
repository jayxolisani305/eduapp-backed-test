import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

import { authorizeRoles } from '../middlewares/authorize.js';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/', requireAuth, authorizeRoles('admin'), getUsers);
router.get('/:id', requireAuth, authorizeRoles('admin'), getUserById);
router.put('/:id', requireAuth, authorizeRoles('admin'), updateUser);
router.delete('/:id', requireAuth, authorizeRoles('admin'), deleteUser);


export default router;
