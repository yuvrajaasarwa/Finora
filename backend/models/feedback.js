const db = require('../db');

const Feedback = {
  findAll() {
    return db.query('SELECT * FROM feedback ORDER BY id DESC');
  },
  create({ userName = 'Anonymous', userEmail = '', rating = 5, message }) {
    const res = db.run(
      'INSERT INTO feedback (user_name, user_email, rating, message, status) VALUES (?, ?, ?, ?, ?)',
      [userName, userEmail, rating, message, 'pending']
    );
    return db.get('SELECT * FROM feedback WHERE id = ?', [res.lastInsertRowid]);
  }
};

module.exports = Feedback;
