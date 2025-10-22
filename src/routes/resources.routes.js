import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import {
  createResource,
  getResourcesByTopic,
  deleteResource
} from '../controllers/resources.controller.js';
import multer from 'multer';

const router = express.Router();

// ------------------------ MULTER SETUP ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB
});

// ------------------------ ROUTES ------------------------
router.get('/topic/:topicId', requireAuth, getResourcesByTopic);

router.post(
  '/',
  requireAuth,
  authorizeRoles('teacher', 'admin'),
  upload.single('file'), // receive a single file
  createResource
);

router.delete('/:id', requireAuth, authorizeRoles('teacher', 'admin'), deleteResource);

export default router;
