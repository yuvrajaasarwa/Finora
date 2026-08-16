const db = require('../db');

const Income = {
  findByUserId(userId) {
    return db.query('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, id DESC', [userId]);
  },
  create({ userId, source, amount, frequency = 'monthly', date, category = 'General', notes = '' }) {
    const res = db.run(
      'INSERT INTO income (user_id, source, amount, frequency, date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, source, amount, frequency, date || new Date().toISOString().split('T')[0], category, notes]
    );
    return db.get('SELECT * FROM income WHERE id = ?', [res.lastInsertRowid]);
  },
  delete(id, userId) {
    return db.run('DELETE FROM income WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Income;
