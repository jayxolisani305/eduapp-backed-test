import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import pool from "../models/db.js";

const router = express.Router();

// GET /student/dashboard
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Get enrolled subjects
    const subjectsRes = await pool.query(
      `SELECT s.id, s.name, s.grade
       FROM subjects s
       INNER JOIN enrollments e ON e.subject_id = s.id
       WHERE e.student_id = $1`,
      [studentId]
    );

    const subjects = subjectsRes.rows;

    // 2. For each subject, get topics + assessments
    for (let subject of subjects) {
      const topicsRes = await pool.query(
        `SELECT id, title FROM topics WHERE subject_id = $1`,
        [subject.id]
      );
      subject.topics = topicsRes.rows;

      // Add assessments for each topic
      for (let topic of subject.topics) {
        const assessmentsRes = await pool.query(
          `SELECT id, title, status FROM assessments WHERE topic_id = $1`,
          [topic.id]
        );
        topic.assessments = assessmentsRes.rows;
      }
    }

    res.json({
      message: "Student Dashboard Data",
      subjects,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
