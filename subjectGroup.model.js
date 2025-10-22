import pool from './db.js';

// Create Subject
export const createSubject = async (name, description) => {
  const query = 'INSERT INTO subjects (name, description) VALUES ($1, $2) RETURNING *';
  const values = [name, description];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get all subjects
export const getSubjects = async () => {
  const result = await pool.query('SELECT * FROM subjects ORDER BY id');
  return result.rows;
};

// Create Group
export const createGroup = async (name, subject_id) => {
  const query = 'INSERT INTO groups (name, subject_id) VALUES ($1, $2) RETURNING *';
  const values = [name, subject_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get groups by subject
export const getGroupsBySubject = async (subject_id) => {
  const query = 'SELECT * FROM groups WHERE subject_id = $1 ORDER BY id';
  const result = await pool.query(query, [subject_id]);
  return result.rows;
};
