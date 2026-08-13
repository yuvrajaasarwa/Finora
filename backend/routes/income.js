const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/income
router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/income
router.post('/', async (req, res, next) => {
  try {
    const { source, amount, date, note } = req.body || {};
    if (!source || amount === undefined || !date) {
      return res.status(400).json({ error: 'source, amount and date are required' });
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    const info = await db.run(
      'INSERT INTO income (user_id, source, amount, date, note) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, source, amt, date, note || null]
    );
    const row = await db.get('SELECT * FROM income WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/income/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const info = await db.run(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
