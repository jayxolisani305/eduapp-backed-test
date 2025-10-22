import express from 'express';
import db from '../models/db.js';

const router = express.Router();

// Get all questions for a subject WITH ANSWERS AND COMMENTS
router.get('/questions', async (req, res) => {
  const { subject_id } = req.query;

  try {
    const questionsResult = await db.query(
      `SELECT q.id, q.title, q.body, q.created_at, u.full_name AS author
       FROM questions_for_qna q
       JOIN users u ON q.author_id = u.id
       WHERE q.subject_id = $1
       ORDER BY q.created_at DESC`,
      [subject_id]
    );

    const questionsWithAnswers = await Promise.all(
      questionsResult.rows.map(async (question) => {
        const answersResult = await db.query(
          `SELECT a.id, a.body, a.votes, a.is_accepted, a.created_at, u.full_name AS author
           FROM answers_for_qna a
           JOIN users u ON a.author_id = u.id
           WHERE a.question_id = $1
           ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
          [question.id]
        );

        const answersWithComments = await Promise.all(
          answersResult.rows.map(async (answer) => {
            const commentsResult = await db.query(
              `SELECT c.id, c.body, c.created_at, u.full_name AS author
               FROM comments_for_qna c
               JOIN users u ON c.author_id = u.id
               WHERE c.answer_id = $1
               ORDER BY c.created_at ASC`,
              [answer.id]
            );
            return {
              ...answer,
              comments: commentsResult.rows || []
            };
          })
        );

        return {
          ...question,
          answers: answersWithComments || []
        };
      })
    );

    res.json(questionsWithAnswers);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Add comment to answer
router.post('/answers/:answerId/comments', async (req, res) => {
  const { answerId } = req.params;
  const { body, user_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO comments_for_qna (answer_id, body, author_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [answerId, body, user_id]
    );
    
    const comment = await db.query(
      `SELECT c.id, c.body, c.created_at, u.full_name AS author
       FROM comments_for_qna c
       JOIN users u ON c.author_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json(comment.rows[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get question details with answers
router.get('/questions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const questionResult = await db.query(
      `SELECT q.*, u.full_name AS author
       FROM questions_for_qna q
       JOIN users u ON q.author_id = u.id
       WHERE q.id = $1`,
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const answersResult = await db.query(
      `SELECT a.*, u.full_name AS author
       FROM answers_for_qna a
       JOIN users u ON a.author_id = u.id
       WHERE a.question_id = $1
       ORDER BY a.created_at ASC`,
      [id]
    );

    res.json({
      question: questionResult.rows[0],
      answers: answersResult.rows
    });
  } catch (err) {
    console.error('Error fetching question details:', err);
    res.status(500).json({ error: 'Failed to fetch question details' });
  }
});

// Create a new question
router.post('/questions', async (req, res) => {
  const { title, body, author_id, subject_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO questions_for_qna (title, body, author_id, subject_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, body, author_id, subject_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Create a new answer
router.post('/answers', async (req, res) => {
  const { question_id, body, author_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO answers_for_qna (question_id, body, author_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [question_id, body, author_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating answer:', err);
    res.status(500).json({ error: 'Failed to add answer' });
  }
});

// Accept an answer
router.put('/answers/:id/accept', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE answers_for_qna SET is_accepted = true WHERE id = $1`,
      [id]
    );
    res.json({ message: 'Answer accepted!' });
  } catch (err) {
    console.error('Error accepting answer:', err);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
});

// Vote on an answer
router.put('/answers/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { vote } = req.body;

  try {
    await db.query(
      `UPDATE answers_for_qna SET votes = votes + $1 WHERE id = $2`,
      [vote, id]
    );
    res.json({ message: 'Vote recorded' });
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get unread count for a subject
router.get('/subjects/:subjectId/unread-count', async (req, res) => {
  const { subjectId } = req.params;
  const { user_id } = req.query; // Current user ID

  try {
    // Count questions the user hasn't seen
    const result = await db.query(
      `SELECT COUNT(DISTINCT q.id) as unread_count
       FROM questions_for_qna q
       LEFT JOIN question_views qv ON q.id = qv.question_id AND qv.user_id = $2
       WHERE q.subject_id = $1 AND qv.id IS NULL`,
      [subjectId, user_id]
    );

    res.json({ unread_count: parseInt(result.rows[0].unread_count) });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark questions as read when user views them
router.post('/questions/:questionId/mark-read', async (req, res) => {
  const { questionId } = req.params;
  const { user_id } = req.body;

  try {
    await db.query(
      `INSERT INTO question_views (question_id, user_id, viewed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (question_id, user_id) DO UPDATE SET viewed_at = NOW()`,
      [questionId, user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking question as read:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

export default router;