
import pool from '../models/db.js';  



// Suggest a new question (student suggests)
export async function createSuggestedQuestion(req, res) {
  try {
    const { subject_id, question_text, options, correct_option } = req.body;
    const suggested_by = req.user.id;  // from logged-in user

    if (!question_text || !correct_option || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ message: 'question_text, options, and correct_option are required.' });
    }

    const newQuestion = await pool.query(
      `INSERT INTO suggested_questions (subject_id, question_text, options, correct_option, suggested_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [subject_id, question_text, JSON.stringify(options), correct_option, suggested_by]
    );

    res.status(201).json({ message: 'Question suggested', data: newQuestion.rows[0] });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get all suggested questions (admin/teacher)
export async function getSuggestedQuestions(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM suggested_questions ORDER BY id DESC`);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching suggested questions:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Approve a suggested question - move it to questions + options tables and delete suggestion
export async function approveSuggestedQuestion(req, res) {
  try {
    const { id } = req.params;

    // Get suggestion details
    const suggestionRes = await pool.query(`SELECT * FROM suggested_questions WHERE id = $1`, [id]);
    if (suggestionRes.rows.length === 0) return res.status(404).json({ message: 'Suggestion not found' });

    const suggestion = suggestionRes.rows[0];

    // Insert into questions table
    const questionRes = await pool.query(
      `INSERT INTO questions (subject_id, question_text)
       VALUES ($1, $2) RETURNING *`,
      [suggestion.subject_id, suggestion.question_text]
    );

    const question = questionRes.rows[0];

    // Insert options (assumes options is JSON array of {option_text} objects, and correct_option is index)
    const options = JSON.parse(suggestion.options);

    for (let i = 0; i < options.length; i++) {
      await pool.query(
        `INSERT INTO options (question_id, option_text, is_correct)
         VALUES ($1, $2, $3)`,
        [question.id, options[i].option_text, i === suggestion.correct_option]
      );
    }

    // Delete the suggested question after approval
    await pool.query(`DELETE FROM suggested_questions WHERE id = $1`, [id]);

    res.json({ message: 'Suggested question approved and added to questions', question });
  } catch (err) {
    console.error('Error approving suggested question:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Reject/delete a suggested question
export async function deleteSuggestedQuestion(req, res) {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM suggested_questions WHERE id = $1`, [id]);
    res.json({ message: 'Suggested question deleted' });
  } catch (err) {
    console.error('Error deleting suggested question:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
