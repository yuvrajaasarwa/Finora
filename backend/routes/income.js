const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/income
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/income
router.post('/', auth, async (req, res, next) => {
  try {
    const { source, amount, frequency, date, category, notes } = req.body || {};
    if (!source || amount === undefined) {
      return res.status(400).json({ error: 'Source and amount are required' });
    }

    const numAmount = parseFloat(amount);
    const entryDate = date || new Date().toISOString().split('T')[0];

    const result = db.run(
      'INSERT INTO income (user_id, source, amount, frequency, date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, source, numAmount, frequency || 'monthly', entryDate, category || 'General', notes || '']
    );

    const newItem = db.get('SELECT * FROM income WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/income/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = db.get('SELECT * FROM income WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    db.run('DELETE FROM income WHERE id = ?', [id]);
    return res.json({ message: 'Income record deleted', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
