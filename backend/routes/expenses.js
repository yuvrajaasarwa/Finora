const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const { month } = req.query;
    let rows;
    if (month) {
      rows = await db.all(
        'SELECT * FROM expenses WHERE user_id = ? AND substr(date, 1, 7) = ? ORDER BY date DESC, id DESC',
        [req.user.id, month]
      );
    } else {
      rows = await db.all(
        'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC',
        [req.user.id]
      );
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses
router.post('/', async (req, res, next) => {
  try {
    const { category, amount, date, note } = req.body || {};
    if (!category || amount === undefined || !date) {
      return res.status(400).json({ error: 'category, amount and date are required' });
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const info = await db.run(
      'INSERT INTO expenses (user_id, category, amount, date, note) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, category, amt, date, note || null]
    );
    const row = await db.get('SELECT * FROM expenses WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const info = await db.run(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/expenses/summary/monthly
router.get('/summary/monthly', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT substr(date, 1, 7) as month, category, SUM(amount) as total
       FROM expenses WHERE user_id = ?
       GROUP BY month, category
       ORDER BY month DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
