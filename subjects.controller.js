// controllers/subjects.controller.js
import db from '../models/db.js';

export const createSubject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Subject name is required' });

  try {
    const result = await db.query(
      'INSERT INTO subjects (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM subjects ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

export const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name, description, grade } = req.body;
  
  console.log('🔄 Updating subject:', { id, name, description, grade });
  
  try {
    const result = await db.query(
      'UPDATE subjects SET name = $1, description = $2, grade = $3 WHERE id = $4 RETURNING *',
      [name, description, grade, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ message: 'Failed to update subject: ' + error.message });
  }
};

export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM subjects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete subject' });
  }
};

export const getMySubjects = async (req, res) => {
  const student_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT s.*
       FROM subjects s
       JOIN student_subjects ss ON ss.subject_id = s.id
       WHERE ss.student_id = $1`,
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const enrollSubject = async (req, res) => {
  const student_id = req.user.userId; // ← Change from .id to .userId
  const { subject_id } = req.body;

  if (!student_id) return res.status(400).json({ error: 'User ID is required' });
  if (!subject_id) return res.status(400).json({ error: 'Subject ID is required' });

  try {
    // Check if subject exists
    const subjectCheck = await db.query('SELECT id FROM subjects WHERE id = $1', [subject_id]);
    if (subjectCheck.rows.length === 0) return res.status(404).json({ error: 'Subject not found' });

    // Insert enrollment
    const result = await db.query(`
      INSERT INTO student_subjects (student_id, subject_id)
      VALUES ($1, $2)
      ON CONFLICT (student_id, subject_id) DO NOTHING
      RETURNING *
    `, [student_id, subject_id]);

    if (result.rows.length === 0) {
      return res.json({ message: 'Already enrolled in this subject' });
    }

    res.status(201).json({ message: 'Enrolled successfully', enrollment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all subjects student is enrolled in
// controllers/subjects.controller.js

export const getStudentSubjects = async (req, res) => {
  const student_id = req.user.id;

  try {
    const result = await db.query(`
      SELECT s.id, s.name, s.description
      FROM student_subjects ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.student_id = $1
    `, [student_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
// Get available subjects (not enrolled yet)
export const getAvailableSubjects = async (req, res) => {
  const student_id = req.user.id;
  
  try {
    const result = await db.query(`
      SELECT s.* 
      FROM subjects s
      WHERE s.id NOT IN (
        SELECT subject_id 
        FROM student_subjects 
        WHERE student_id = $1
      )
      ORDER BY s.name
    `, [student_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get subject details with all content
export const getSubjectDetails = async (req, res) => {
  const student_id = req.user.id;
  const { id } = req.params;

  try {
    // Check if student is enrolled
    const enrollmentCheck = await db.query(
      'SELECT 1 FROM student_subjects WHERE student_id = $1 AND subject_id = $2',
      [student_id, id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this subject' });
    }

    // Get subject info
    const subjectResult = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Get topics
    const topicsResult = await db.query(
      'SELECT * FROM topics WHERE subject_id = $1 ORDER BY name',
      [id]
    );

    // Get assessments
    const assessmentsResult = await db.query(
      'SELECT * FROM assessments WHERE subject_id = $1 AND approved = true ORDER BY created_at DESC',
      [id]
    );

    // For each topic, get resources
    const topicsWithResources = await Promise.all(
      topicsResult.rows.map(async (topic) => {
        const resourcesResult = await db.query(
          'SELECT * FROM resources WHERE topic_id = $1 ORDER BY title',
          [topic.id]
        );
        return {
          ...topic,
          resources: resourcesResult.rows
        };
      })
    );

    res.json({
      subject: subjectResult.rows[0],
      topics: topicsWithResources,
      assessments: assessmentsResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unenroll from subject
export const unenrollSubject = async (req, res) => {
  const student_id = req.user.id;
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM student_subjects WHERE student_id = $1 AND subject_id = $2 RETURNING *',
      [student_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'Successfully unenrolled from subject' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// In controllers/subjects.controller.js
export const getEnrolledSubjects = async (req, res) => {
  try {
    const studentId = req.user.userId;
    console.log('✅ Using student_id:', studentId);

    // Fixed query - removed reference to non-existent s.code column
    const result = await db.query(
      `SELECT 
         ss.*, 
         s.id as subject_id,
         s.name as subject_name, 
         s.description, 
         s.grade
       FROM student_subjects ss 
       JOIN subjects s ON ss.subject_id = s.id 
       WHERE ss.student_id = $1 
       ORDER BY ss.enrolled_at DESC`,
      [studentId]
    );

    console.log('✅ Found', result.rows.length, 'enrolled subjects');

    // Format response with only existing columns
    const enrollments = result.rows.map(row => ({
      id: row.id,
      student_id: row.student_id,
      subject_id: row.subject_id,
      enrolled_at: row.enrolled_at,
      subject: {
        id: row.subject_id,
        name: row.subject_name,
        description: row.description,
        grade: row.grade
        // Removed 'code' property since it doesn't exist in database
      }
    }));

    res.json(enrollments);

  } catch (error) {
    console.error('💥 Error in getEnrolledSubjects:', error);
    res.status(500).json({ 
      error: 'Failed to fetch enrolled subjects',
      details: error.message 
    });
  }
};


// Add this to your controller for testing
export const debugUser = async (req, res) => {
  try {
    console.log('🔍 Debug - req.user:', req.user);
    console.log('🔍 Debug - req.headers:', req.headers);
    
    res.json({
      user: req.user,
      message: 'Debug information',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: 'Debug failed' });
  }
};

