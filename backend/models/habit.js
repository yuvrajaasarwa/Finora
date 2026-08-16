const db = require('../db');

const Habit = {
  findByUserId(userId) {
    return db.query('SELECT * FROM habits WHERE user_id = ? ORDER BY id DESC', [userId]);
  },
  create({ userId, title, targetDays = 30, category = 'Financial' }) {
    const res = db.run(
      'INSERT INTO habits (user_id, title, target_days, category) VALUES (?, ?, ?, ?)',
      [userId, title, targetDays, category]
    );
    return db.get('SELECT * FROM habits WHERE id = ?', [res.lastInsertRowid]);
  },
  delete(id, userId) {
    return db.run('DELETE FROM habits WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Habit;
