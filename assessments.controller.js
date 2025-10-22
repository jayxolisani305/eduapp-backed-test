// assessments.controller.js - Updated with auto-approval for admin
import db from '../models/db.js';

// ----------------- CREATE ASSESSMENT -----------------
export const createAssessment = async (req, res) => {
  try {
    const { title, subject_id, group_id } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role; // Assuming role is available in req.user

    // Validation
    if (!title || !subject_id || !group_id) {
      return res.status(400).json({ error: 'Title, subject_id and group_id are required' });
    }

    // Check if subject exists
    const subjectCheck = await db.query('SELECT id FROM subjects WHERE id = $1', [subject_id]);
    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Check if group exists
    const groupCheck = await db.query('SELECT id FROM groups WHERE id = $1', [group_id]);
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Auto-approve if user is admin, otherwise set to pending
    const approved = user_role === 'admin' ? true : false;
    const status = user_role === 'admin' ? 'active' : 'pending';

    // Create assessment
    const result = await db.query(`
      INSERT INTO assessments (
        title, 
        subject_id, 
        group_id, 
        created_by, 
        approved, 
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, title, subject_id, group_id, approved, status, created_at
    `, [title.trim(), subject_id, group_id, user_id, approved, status]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

// ----------------- GET ALL ASSESSMENTS -----------------
export const getAllAssessments = async (req, res) => {
  try {
    const { subject_id } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.status,
        a.approved,
        a.total_marks,
        a.duration_minutes,
        a.created_at,
        a.subject_id,
        a.group_id,
        s.name as subject_name,
        g.name as group_name
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN groups g ON a.group_id = g.id
    `;
    
    const params = [];
    if (subject_id) {
      query += ' WHERE a.subject_id = $1';
      params.push(subject_id);
    }
    
    query += ' ORDER BY a.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ message: 'Failed to get assessments', error });
  }
};


// ----------------- UPDATE ASSESSMENT -----------------
export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length < 1) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await db.query(`
      UPDATE assessments
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, title, subject_id, group_id, approved, status
    `, [title.trim(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

// ----------------- DELETE ASSESSMENT -----------------
export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM assessments WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};

// ----------------- APPROVE/UNAPPROVE ASSESSMENT (ADMIN ONLY) -----------------
export const approveAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    // Toggle approval status
    const result = await db.query(`
      UPDATE assessments
      SET 
        approved = NOT approved,
        status = CASE 
          WHEN NOT approved THEN 'active'
          ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, title, subject_id, group_id, approved, status
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Approve assessment error:', error);
    res.status(500).json({ error: 'Failed to approve assessment' });
  }
};

// ----------------- ADD QUESTION TO ASSESSMENT -----------------
export const addQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, question_type = 'multiple_choice', marks = 1 } = req.body;

    if (!question_text || question_text.trim().length < 1) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    // Check if assessment exists
    const assessmentCheck = await db.query('SELECT id FROM assessments WHERE id = $1', [id]);
    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Insert question
    const result = await db.query(`
      INSERT INTO questions (assessment_id, question_text, question_type, marks, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, question_text, question_type, marks
    `, [id, question_text.trim(), question_type, marks]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
};

// ----------------- DELETE QUESTION -----------------
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// ----------------- ADD OPTION TO QUESTION -----------------
export const addOption = async (req, res) => {
  try {
    const { assessmentId, questionId } = req.params;
    const { option_text, is_correct = false } = req.body;

    if (!option_text || option_text.trim().length < 1) {
      return res.status(400).json({ error: 'Option text is required' });
    }

    // Verify question exists and belongs to the assessment
    const questionCheck = await db.query(
      'SELECT id FROM questions WHERE id = $1 AND assessment_id = $2',
      [questionId, assessmentId]
    );

    if (questionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // If this option is marked as correct, unmark other correct options
    if (is_correct) {
      await db.query(
        'UPDATE question_options SET is_correct = false WHERE question_id = $1',
        [questionId]
      );
    }

    const result = await db.query(`
      INSERT INTO question_options (question_id, option_text, is_correct, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id, option_text, is_correct
    `, [questionId, option_text.trim(), is_correct]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add option error:', error);
    res.status(500).json({ error: 'Failed to add option' });
  }
};

// ----------------- DELETE OPTION -----------------
export const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM question_options WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }

    res.json({ message: 'Option deleted successfully' });
  } catch (error) {
    console.error('Delete option error:', error);
    res.status(500).json({ error: 'Failed to delete option' });
  }
};

// ----------------- GET CORRECT ANSWERS (TEACHER/ADMIN) -----------------
export const getCorrectAnswers = async (req, res) => {
  try {
    const { id: assessment_id } = req.params;

    const result = await db.query(`
      SELECT 
        q.id AS question_id, 
        q.question_text,
        o.id AS option_id, 
        o.option_text
      FROM questions q
      JOIN question_options o ON q.id = o.question_id
      WHERE q.assessment_id = $1 AND o.is_correct = true
      ORDER BY q.id
    `, [assessment_id]);

    res.json({ success: true, correctAnswers: result.rows });
  } catch (err) {
    console.error('Get correct answers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ----------------- SUBMIT ASSESSMENT (STUDENT) -----------------
export const submitAssessment = async (req, res) => {
  const student_id = req.user.id;
  const { assessmentId } = req.params;
  const { answers } = req.body; // answers: [{ question_id, selected_option_id }]

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Answers are required' });
  }

  try {
    // Check if assessment exists and is approved
    const assessmentCheck = await db.query(
      'SELECT id, title FROM assessments WHERE id = $1 AND approved = true',
      [assessmentId]
    );
    
    if (assessmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found or not approved' });
    }

    // Calculate score
    let score = 0;
    let totalMarks = 0;
    
    for (const ans of answers) {
      // Get question marks
      const questionResult = await db.query(
        'SELECT marks FROM questions WHERE id = $1',
        [ans.question_id]
      );
      
      if (questionResult.rows.length > 0) {
        const questionMarks = questionResult.rows[0].marks || 1;
        totalMarks += questionMarks;
        
        // Check if answer is correct
        const correctCheck = await db.query(
          'SELECT id FROM question_options WHERE question_id = $1 AND is_correct = true AND id = $2',
          [ans.question_id, ans.selected_option_id]
        );
        
        if (correctCheck.rows.length > 0) {
          score += questionMarks;
        }
      }
    }

    // Save submission (or update if already exists)
    const result = await db.query(`
      INSERT INTO student_assessments (student_id, assessment_id, answers, score, submitted_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (student_id, assessment_id) 
      DO UPDATE SET 
        answers = EXCLUDED.answers, 
        score = EXCLUDED.score, 
        submitted_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [student_id, assessmentId, JSON.stringify(answers), score]);

    res.json({ 
      message: 'Assessment submitted successfully', 
      submission: result.rows[0], 
      score,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ----------------- GET SUBMISSION RESULT (STUDENT) -----------------
export const getSubmissionResult = async (req, res) => {
  const student_id = req.user.id;
  const { assessmentId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        sa.*,
        a.title,
        a.subject_id,
        s.name as subject_name
      FROM student_assessments sa
      JOIN assessments a ON sa.assessment_id = a.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE sa.student_id = $1 AND sa.assessment_id = $2
    `, [student_id, assessmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No submission found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get submission result error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ----------------- GET ALL SUBMISSIONS (TEACHER/ADMIN) -----------------
export const getAllSubmissions = async (req, res) => {
  const { assessmentId } = req.params;

  try {
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
    `, [assessmentId]);

    res.json({ submissions: result.rows });
  } catch (err) {
    console.error('Get all submissions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
// ----------------- GET SINGLE ASSESSMENT WITH QUESTIONS -----------------

export const getAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📥 Fetching assessment ID:', id); // Debug log

    // Get assessment details
    const assessmentResult = await db.query(`
      SELECT 
        a.*,
        s.name as subject_name,
        g.name as group_name
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = $1
    `, [id]);

    if (assessmentResult.rows.length === 0) {
      console.log('❌ Assessment not found');
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const assessment = assessmentResult.rows[0];
    console.log('✅ Found assessment:', assessment.title);

    // ⚠️ CRITICAL: Get questions ONLY for THIS assessment
    const questionsResult = await db.query(`
      SELECT 
        q.id, 
        q.question_text, 
        q.question_type,
        q.marks,
        q.assessment_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'option_text', o.option_text,
              'is_correct', o.is_correct
            ) ORDER BY o.id
          ) FILTER (WHERE o.id IS NOT NULL), '[]'::json
        ) as options
      FROM questions q
      LEFT JOIN question_options o ON q.id = o.question_id
      WHERE q.assessment_id = $1
      GROUP BY q.id, q.question_text, q.question_type, q.marks, q.assessment_id
      ORDER BY q.created_at
    `, [id]);

    console.log(`📊 Found ${questionsResult.rows.length} questions for assessment ${id}`);

    // Calculate total marks
    const totalMarks = questionsResult.rows.reduce((sum, q) => sum + (q.marks || 0), 0);

    const response = {
      ...assessment,
      id: assessment.id.toString(),
      subject_id: assessment.subject_id.toString(),
      group_id: assessment.group_id.toString(),
      total_marks: totalMarks,
      questions: questionsResult.rows.map(q => ({
        id: q.id.toString(),
        assessment_id: q.assessment_id.toString(),
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        options: q.options || []
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Get assessment error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
};