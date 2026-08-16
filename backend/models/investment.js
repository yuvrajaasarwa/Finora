const db = require('../db');

const Investment = {
  findByUserId(userId) {
    return db.query('SELECT * FROM investments WHERE user_id = ? ORDER BY id DESC', [userId]);
  },
  create({ userId, name, type = 'Stocks', amount, returns = 0, date, notes = '' }) {
    const res = db.run(
      'INSERT INTO investments (user_id, name, type, amount, returns, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, type, amount, returns, date || new Date().toISOString().split('T')[0], notes]
    );
    return db.get('SELECT * FROM investments WHERE id = ?', [res.lastInsertRowid]);
  },
  delete(id, userId) {
    return db.run('DELETE FROM investments WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Investment;
