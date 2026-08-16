const db = require('../db');

const User = {
  findById(id) {
    return db.get('SELECT * FROM users WHERE id = ?', [id]);
  },
  findByEmail(email) {
    return db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  },
  create({ name, email, password, currency = 'USD', role = 'user' }) {
    const res = db.run(
      'INSERT INTO users (name, email, password, currency, role) VALUES (?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), password, currency, role]
    );
    return this.findById(res.lastInsertRowid);
  }
};

module.exports = User;
