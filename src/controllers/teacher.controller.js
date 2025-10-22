// controllers/teacher.controller.js
import db from '../models/db.js';

// Get teacher statistics
export const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Get total assessments created by this teacher
    const totalAssessmentsResult = await db.query(
      'SELECT COUNT(*) FROM assessments WHERE created_by = $1',
      [teacherId]
    );
    
    // Get pending approval assessments
    const pendingApprovalResult = await db.query(
      'SELECT COUNT(*) FROM assessments WHERE created_by = $1 AND approved = false',
      [teacherId]
    );
    
    // Get total students - Since we can't link via teacher_id, we'll use a different approach
    // Count students who are enrolled in subjects that have assessments created by this teacher
    const totalStudentsResult = await db.query(
      `SELECT COUNT(DISTINCT ss.student_id) 
       FROM student_subjects ss 
       WHERE ss.subject_id IN (
         SELECT DISTINCT subject_id FROM assessments WHERE created_by = $1
       )`,
      [teacherId]
    );
    
    // Get pending grading submissions
    const pendingGradingResult = await db.query(
      `SELECT COUNT(*) 
       FROM student_assessments sa 
       JOIN assessments a ON sa.assessment_id = a.id 
       WHERE a.created_by = $1 AND sa.score IS NULL`,
      [teacherId]
    );
    
    // Get classes today - Check if classes table exists first
    let classesToday = 0;
    try {
      // Check if classes table exists
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'classes'
        )
      `);
      
      if (tableCheck.rows[0].exists) {
        const classesTodayResult = await db.query(
          'SELECT COUNT(*) FROM classes WHERE teacher_id = $1 AND DATE(schedule_date) = CURRENT_DATE',
          [teacherId]
        );
        classesToday = parseInt(classesTodayResult.rows[0].count) || 0;
      }
    } catch (error) {
      console.log('Classes table not available:', error.message);
    }

    res.json({
      classesToday: classesToday,
      pendingGrading: parseInt(pendingGradingResult.rows[0].count) || 0,
      totalAssessments: parseInt(totalAssessmentsResult.rows[0].count) || 0,
      totalStudents: parseInt(totalStudentsResult.rows[0].count) || 0,
      pendingApproval: parseInt(pendingApprovalResult.rows[0].count) || 0
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
};

// Get teacher's assessments
export const getTeacherAssessments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const result = await db.query(`
      SELECT 
        a.*, 
        s.name as subject_name,
        (SELECT COUNT(*) FROM student_assessments WHERE assessment_id = a.id) as submission_count
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.created_by = $1
      ORDER BY a.created_at DESC
    `, [teacherId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get teacher assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher assessments' });
  }
};

// Create assessment
export const createTeacherAssessment = async (req, res) => {
  try {
    const { title, subject_id, group_id, description, total_marks, duration_minutes, type } = req.body;
    const teacherId = req.user.id;

    // Validation
    if (!title || !subject_id || !group_id) {
      return res.status(400).json({ error: 'Title, subject_id, and group_id are required' });
    }

    const result = await db.query(`
      INSERT INTO assessments (
        title, subject_id, group_id, description, 
        total_marks, duration_minutes, type, created_by, 
        status, approved, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', false, CURRENT_TIMESTAMP)
      RETURNING *
    `, [title, subject_id, group_id, description, total_marks, duration_minutes, type, teacherId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create teacher assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

// Get assessment submissions
export const getAssessmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Verify the assessment belongs to this teacher
    const assessmentCheck = await db.query(
      'SELECT id FROM assessments WHERE id = $1 AND created_by = $2',
      [id, teacherId]
    );

    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found or access denied' });
    }

    const result = await db.query(`
      SELECT 
        sa.id,
        sa.student_id,
        sa.answers,
        sa.score,
        sa.submitted_at,
        u.full_name as student_name,
        u.email as student_email
      FROM student_assessments sa
      JOIN users u ON sa.student_id = u.id
      WHERE sa.assessment_id = $1
      ORDER BY sa.submitted_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get assessment submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Grade submission
export const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const teacherId = req.user.id;

    // Verify the teacher has access to this submission
    const submissionCheck = await db.query(`
      SELECT sa.id 
      FROM student_assessments sa
      JOIN assessments a ON sa.assessment_id = a.id
      WHERE sa.id = $1 AND a.created_by = $2
    `, [id, teacherId]);

    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or access denied' });
    }

    const result = await db.query(`
      UPDATE student_assessments 
      SET score = $1, graded_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [score, id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};