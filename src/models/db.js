import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test DB connection on startup without leaking connections
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log(`✅ Connected to DB successfully`);
  } catch (err) {
    console.error('❌ DB connection error:', err);
  }
})();

export default pool;
