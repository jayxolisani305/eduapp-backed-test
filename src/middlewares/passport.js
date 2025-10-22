import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../models/db.js'; // your PostgreSQL connection pool
import dotenv from 'dotenv';
dotenv.config();

// async function findOrCreateUser({ email, provider, providerId, profileName }) {
//   // Try find user by Google ID
//   const userByProvider = await pool.query(
//     `SELECT * FROM users WHERE ${provider}_id = $1`,
//     [providerId]
//   );
//   if (userByProvider.rows.length) return userByProvider.rows[0];

//   // Try find by email and link Google ID
//   if (email) {
//     const userByEmail = await pool.query(
//       `SELECT * FROM users WHERE email = $1`,
//       [email]
//     );
//     if (userByEmail.rows.length) {
//       await pool.query(
//         `UPDATE users SET ${provider}_id = $1 WHERE id = $2`,
//         [providerId, userByEmail.rows[0].id]
//       );
//       const updatedUser = await pool.query(
//         `SELECT * FROM users WHERE id = $1`,
//         [userByEmail.rows[0].id]
//       );
//       return updatedUser.rows[0];
//     }
//   }

//   // Create new user
//   const newUser = await pool.query(
//     `INSERT INTO users (full_name, email, ${provider}_id, role, is_verified)
//      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
//     [profileName || null, email || null, providerId, 'student', true]
//   );
//   return newUser.rows[0];
// }

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: 'http://localhost:5000/auth/google/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails[0].value;
//         const user = await findOrCreateUser({
//           email,
//           provider: 'google',
//           providerId: profile.id,
//           profileName: profile.displayName,
//         });
//         return done(null, user);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );

export default passport;
