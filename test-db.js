import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

let pool;

if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL connection string');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  console.log('Using separate environment variables');
  pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
  });
}

// Print environment variables (except password) for debugging
console.log('DB User:', process.env.DB_USER || '(none)');
console.log('DB Host:', process.env.DB_HOST || '(none)');
console.log('DB Port:', process.env.DB_PORT || '(none)');
console.log('DB Name:', process.env.DB_NAME || '(none)');
console.log('DATABASE_URL:', process.env.DATABASE_URL || '(none)');

console.log('Type of DB Password:', typeof process.env.DB_PASSWORD);
console.log('Type of DATABASE_URL:', typeof process.env.DATABASE_URL);

pool.connect()
  .then(client => {
    console.log('✅ Connected to DB!');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
  import pool from './models/db.js';

async function test() {
  try {
    const res = await pool.query('SELECT * FROM subjects LIMIT 1');
    console.log('Subjects:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error querying subjects:', err);
    process.exit(1);
  }
}

test();

