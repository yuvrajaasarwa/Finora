const db = require('../db');

const Goal = {
  findByUserId(userId) {
    return db.query('SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC', [userId]);
  },
  create({ userId, title, targetAmount, currentAmount = 0, targetDate, category = 'Savings' }) {
    const res = db.run(
      'INSERT INTO goals (user_id, title, target_amount, current_amount, target_date, category) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, targetAmount, currentAmount, targetDate || null, category]
    );
    return db.get('SELECT * FROM goals WHERE id = ?', [res.lastInsertRowid]);
  },
  delete(id, userId) {
    return db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Goal;
