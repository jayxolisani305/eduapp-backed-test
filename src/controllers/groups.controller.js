// controllers/groups.controller.js
import db from '../models/db.js';

export const createGroup = async (req, res) => {
  const { name, subject_id } = req.body;
  if (!name || !subject_id) {
    return res.status(400).json({ message: 'Name and subject_id are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO groups (name, subject_id) VALUES ($1, $2) RETURNING *',
      [name, subject_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
};


export const getGroupsBySubject = async (req, res) => {
  const { subject_id } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM groups WHERE subject_id = $1 ORDER BY name',
      [subject_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups by subject:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
};

export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const result = await db.query(
      'UPDATE groups SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update group' });
  }
};

export const deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM groups WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete group' });
  }
};
export const handleCreateGroup = (req, res) => {
  // your logic here
};
export const handleCreateSubject = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Subject name is required' });
  }

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
export const handleGetGroupsBySubject = async (req, res) => {
  const { subject_id } = req.params;

  if (!subject_id) {
    return res.status(400).json({ message: 'subject_id is required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM groups WHERE subject_id = $1',
      [subject_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching groups by subject:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
};
export const handleGetSubjects = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM subjects ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

// controllers/groups.controller.js

export const getAllGroups = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM groups');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getGroupById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching group by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};