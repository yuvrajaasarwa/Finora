const db = require('../db');

const Expense = {
  findByUserId(userId) {
    return db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [userId]);
  },
  create({ userId, title, amount, category = 'Other', date, notes = '' }) {
    const res = db.run(
      'INSERT INTO expenses (user_id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, amount, category, date || new Date().toISOString().split('T')[0], notes]
    );
    return db.get('SELECT * FROM expenses WHERE id = ?', [res.lastInsertRowid]);
  },
  delete(id, userId) {
    return db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Expense;
