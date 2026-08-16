const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, amount, category, date, notes } = req.body || {};
    if (!title || amount === undefined) {
      return res.status(400).json({ error: 'Title and amount are required' });
    }

    const numAmount = parseFloat(amount);
    const entryDate = date || new Date().toISOString().split('T')[0];

    const result = db.run(
      'INSERT INTO expenses (user_id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, numAmount, category || 'Other', entryDate, notes || '']
    );

    const newItem = db.get('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    db.run('DELETE FROM expenses WHERE id = ?', [id]);
    return res.json({ message: 'Expense record deleted', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
