import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  ssl: false, // or your SSL config if needed
});

// Test DB connection on startup without leaking connections
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log(`✅ Connected to DB: ${process.env.DB_NAME}`);
  } catch (err) {
    console.error('❌ DB connection error:', err);
  }
})();

export default pool;
