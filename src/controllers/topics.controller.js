import db from '../models/db.js';

import pool from '../models/db.js';

export const createTopic = async (req, res) => {
  try {
    const { name, description, group_id, subject_id } = req.body;

    const result = await pool.query(
      `INSERT INTO topics (name, description, group_id, subject_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, group_id, subject_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Failed to create topic' });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, group_id } = req.body;  // Removed subject_id

    const result = await db.query(
      `UPDATE topics
       SET name = $1, description = $2, group_id = $3
       WHERE id = $4
       RETURNING *`,
      [name, description || null, group_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(500).json({ message: "Failed to update topic" });
  }
};

export const deleteTopic = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    res.json({ message: 'Topic deleted' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Failed to delete topic' });
  }
};

export const getAllTopics = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM topics');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM topics WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTopicsBySubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const result = await pool.query(
      `SELECT * FROM topics WHERE subject_id = $1`,
      [subjectId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Failed to fetch topics' });
  }
};




export const createManyTopics = async (req, res) => {
  const client = await pool.connect();
  try {
    const topics = req.body.topics; 

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: 'No topics provided' });
    }

    const insertQuery = `
  INSERT INTO topics (name, description, subject_id, group_id)
  VALUES ${topics.map((_, i) =>
    `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
  ).join(', ')}
  RETURNING *;
`;

const values = topics.flatMap(({ name, description, subject_id, group_id }) =>
  [name, description || '', subject_id, group_id]
);

    const result = await client.query(insertQuery, values);

    res.status(201).json({ message: 'Topics created successfully', topics: result.rows });
  } catch (err) {
    console.error('Error creating topics:', err);
    res.status(500).json({ message: 'Failed to create topics' });
  } finally {
    client.release();
  }
};

// Get topics for all enrolled subjects
export const getEnrolledTopics = async (req, res) => {
  const student_id = req.user.id;

  try {
    const result = await db.query(`
      SELECT t.*
      FROM topics t
      JOIN student_subjects ss ON t.subject_id = ss.subject_id
      WHERE ss.student_id = $1
      ORDER BY t.subject_id, t.name
    `, [student_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get assessments for all enrolled subjects
export const getEnrolledAssessments = async (req, res) => {
  const student_id = req.user.id;

  try {
    const result = await db.query(`
      SELECT a.*
      FROM assessments a
      JOIN student_subjects ss ON a.subject_id = ss.subject_id
      WHERE ss.student_id = $1 AND a.approved = true
      ORDER BY a.created_at DESC
    `, [student_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getTopicsAndAssessments = async (req, res) => {
  const student_id = req.user.id;
  const { subject_id } = req.params;

  try {
    // Check if student is enrolled
    const check = await db.query(`SELECT 1 FROM student_subjects WHERE student_id=$1 AND subject_id=$2`, [student_id, subject_id]);
    if (check.rows.length === 0) return res.status(403).json({ error: 'Not enrolled in this subject' });

    // Get topics and assessments
    const topics = await db.query(`
      SELECT t.id, t.title
      FROM topics t
      WHERE t.subject_id = $1
    `, [subject_id]);

    const assessments = await db.query(`
      SELECT a.id, a.title, a.group_id
      FROM assessments a
      WHERE a.subject_id = $1 AND a.approved = true
    `, [subject_id]);

    res.json({ topics: topics.rows, assessments: assessments.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
