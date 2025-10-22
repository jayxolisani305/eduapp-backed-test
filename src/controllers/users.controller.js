import pool from '../models/db.js';
import bcrypt from 'bcrypt';


/** Get all users (admin only) */
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Get single user by id (admin or user themselves) */
export const getUserById = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  if (requesterRole !== 'admin' && requesterId !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Update user (admin or user themselves) */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  if (requesterRole !== 'admin' && requesterId !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         role = CASE WHEN $3 IS NOT NULL AND $4 = 'admin' THEN $3 ELSE role END,
         password = COALESCE($5, password)
       WHERE id = $6 RETURNING id, name, email, role`,
      [name, email, role, requesterRole, hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Delete user (admin only) */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
