import pool from '../models/db.js';
import bcrypt from 'bcryptjs';

export const createUser = async ({ full_name, email, password, role, oauthUser = false }) => {
  try {
    
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    let hashedPassword = null;
    if (!oauthUser) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, email, hashedPassword, role, oauthUser ? true : false] 
    );

    return newUser.rows[0];
  } catch (error) {
    throw error;
  }
};
