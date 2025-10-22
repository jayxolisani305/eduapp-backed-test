import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
//import passport from './middlewares/passport.js';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.routes.js';
import topicRoutes from './routes/topics.routes.js';
import subjectRoutes from './routes/subjects.routes.js';
import groupRoutes from './routes/groups.routes.js';
import questionRoutes from './routes/questions.routes.js';
import assessmentRoutes from './routes/assessments.routes.js';
import userRoutes from './routes/users.routes.js';
import resourcesRouter from './routes/resources.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import parentRoutes from './routes/parents.js';
import parentChildrenRoutes from './routes/parent-children.js';
import qnaRouter from './routes/qna.js';
import studentDashboardRoutes from "./routes/studentDashboard.routes.js";

// Setup
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourcesRouter);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/parent-children', parentChildrenRoutes);
app.use('/api/qna', qnaRouter);
app.use('/student', studentDashboardRoutes);

// Example routes
app.get('/dashboard', (req, res) => res.json({ message: 'Authenticated!' }));
app.get('/admin', (req, res) => res.json({ message: 'Admin route!' }));

// Single port for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

