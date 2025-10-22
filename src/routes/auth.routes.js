import express from 'express';
import {
  signup,
  login,
  verifyEmail,
  requestResetPassword,
  resetPassword,
  getMe,
} from '../controllers/auth.controller.js';
import { requireAuth, authorizeRoles, isAdmin } from '../middlewares/auth.middleware.js';
import passport from '../middlewares/passport.js';
import jwt from 'jsonwebtoken';
import { googleCallback } from "../controllers/auth.controller.js";
;
const router = express.Router();
// somewhere with other routes:
router.get('/verify/:token', verifyEmail);

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify/:token', verifyEmail); 
router.post('/request-password-reset', requestResetPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/api/subject', requireAuth, (req, res) => {
  // Now req.user is available
  res.json({ message: 'Success', user: req.user });
});
router.get("/me", requireAuth, getMe);

router.get('/admin/dashboard', requireAuth, isAdmin, (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

function isAllowedRedirect(url) {
  const whitelist = (process.env.OAUTH_REDIRECT_WHITELIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!whitelist.length) return false;
  return whitelist.includes(url);
}

// Start Google OAuth
router.get(
  '/google',
  (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(
      req,
      res,
      next
    );
  }
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const redirectTo = req.query.redirect;
    if (redirectTo && isAllowedRedirect(redirectTo)) {
      const separator = redirectTo.includes('?') ? '&' : '?';
      return res.redirect(`${redirectTo}${separator}token=${token}`);
    }

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  }
);

// Start Google login
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));


router.get('/verify/:token', verifyEmail);

// Route for all logged-in users
router.get('/profile', requireAuth, (req, res) => {
  res.json({ message: `Welcome, ${req.user.role}!` });
});

// Only teachers
router.post('/create-class', requireAuth, authorizeRoles('teacher'), (req, res) => {
  res.json({ message: 'Class created successfully!' });
});

// Only students
router.get('/my-grades', requireAuth, authorizeRoles('student'), (req, res) => {
  res.json({ message: 'Here are your grades' });
});

// Teachers + Admin
router.post('/add-assignment', requireAuth, authorizeRoles('teacher', 'admin'), (req, res) => {
  res.json({ message: 'Assignment added successfully!' });
});

// Admin only
router.delete('/delete-user/:id', requireAuth, isAdmin, (req, res) => {
  res.json({ message: 'User deleted by Admin' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    userId: req.user.userId,
    role: req.user.role,
  });
});

export default router;