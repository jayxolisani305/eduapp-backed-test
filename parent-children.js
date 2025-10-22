// routes/parent-children.js
import express from 'express';
import db from '../models/db.js';

const router = express.Router();

// Link a student to parent (update parent_id in users table)
router.post('/link', async (req, res) => {
  try {
    const { parent_id, student_email } = req.body;
    
    console.log('📝 Link request:', { parent_id, student_email });
    
    if (!parent_id || !student_email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'parent_id and student_email are required'
      });
    }

    // Verify parent exists in USERS table and is actually a parent
    const parentQuery = `
      SELECT id, role FROM users WHERE id = $1 AND role = 'parent'
    `;
    const parentResult = await db.query(parentQuery, [parent_id]);
    
    console.log('👤 Parent lookup result:', parentResult.rows);
    
    if (parentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Parent not found',
        message: 'No parent found with this ID'
      });
    }

    // Find student by email in USERS table
    const studentQuery = `
      SELECT id, full_name, email, role
      FROM users 
      WHERE email = $1 AND role = 'student'
    `;
    const studentResult = await db.query(studentQuery, [student_email]);
    
    console.log('👨‍🎓 Student lookup result:', studentResult.rows);
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Student not found',
        message: 'No student found with this email address'
      });
    }

    const student = studentResult.rows[0];

    // Check if this combination already exists in students table
    const checkExistingQuery = `
      SELECT id FROM students 
      WHERE id = $1 AND parent_id = $2
    `;
    const existingResult = await db.query(checkExistingQuery, [student.id, parent_id]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Student already linked',
        message: 'This student is already linked to your account'
      });
    }

    // Insert or update in students table with parent_id
    const upsertQuery = `
      INSERT INTO students (id, full_name, email, role, parent_id, is_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        parent_id = $5,
        full_name = $2,
        email = $3
      RETURNING *
    `;
    
    const upsertResult = await db.query(upsertQuery, [
      student.id,
      student.full_name,
      student.email,
      student.role,
      parent_id
    ]);
    
    console.log('✅ Student linked successfully:', upsertResult.rows[0]);
    
    res.json({
      success: true,
      message: 'Student linked successfully',
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email
      }
    });
  } catch (error) {
    console.error('❌ Error linking student:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Unlink student from parent
router.delete('/unlink/:parentId/:studentId', async (req, res) => {
  try {
    const { parentId, studentId } = req.params;
    
    console.log('🔓 Unlink request:', { parentId, studentId });
    
    // Verify the student belongs to this parent in students table
    const verifyQuery = `
      SELECT id FROM students WHERE id = $1 AND parent_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [studentId, parentId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Student not found or does not belong to this parent'
      });
    }

    // Remove the link by setting parent_id to NULL
    const updateQuery = `
      UPDATE students 
      SET parent_id = NULL 
      WHERE id = $1
      RETURNING id
    `;
    
    await db.query(updateQuery, [studentId]);
    
    console.log('✅ Student unlinked successfully');
    
    res.json({
      success: true,
      message: 'Student unlinked successfully'
    });
  } catch (error) {
    console.error('❌ Error unlinking student:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Search students for linking (from USERS table, not yet linked)
router.get('/search-students', async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('🔍 Search query:', query);
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: 'Query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Search in users table for students only, exclude already linked ones
    const searchQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        s.grade_level,
        s.class_name
      FROM users u
      LEFT JOIN students s ON u.id = s.id
      WHERE u.role = 'student'
      AND (s.parent_id IS NULL OR s.id IS NULL)
      AND (u.email ILIKE $1 OR u.full_name ILIKE $1)
      ORDER BY u.full_name
      LIMIT 10
    `;
    
    const result = await db.query(searchQuery, [`%${query}%`]);
    
    console.log('✅ Search results:', result.rows.length, 'students found');
    console.log('Students:', result.rows.map(r => ({ name: r.full_name, email: r.email })));
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error searching students:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;