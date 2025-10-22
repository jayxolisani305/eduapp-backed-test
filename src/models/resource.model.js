// models/resource.model.js
import db from './db.js';

class Resource {
  static async create({ topic_id, type, title, file_path, url }) {
    const result = await db.query(
      'INSERT INTO resources (topic_id, type, title, file_path, url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [topic_id, type, title, file_path, url]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM resources WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getByTopic(topicId) {
    const result = await db.query(
      'SELECT * FROM resources WHERE topic_id = $1 ORDER BY created_at DESC',
      [topicId]
    );
    return result.rows;
  }
}

export default Resource;