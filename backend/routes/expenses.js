const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.id]);
    const formatted = rows.map(r => ({
      ...r,
      title: r.title || r.category || 'Expense',
      note: r.notes || r.note || '',
      notes: r.notes || r.note || ''
    }));
    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, amount, category, date, notes, note } = req.body || {};
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const numAmount = parseFloat(amount);
    const entryDate = date || new Date().toISOString().split('T')[0];
    const itemTitle = title || category || 'Expense';
    const itemNote = notes || note || '';

    const result = db.run(
      'INSERT INTO expenses (user_id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, itemTitle, numAmount, category || 'Other', entryDate, itemNote]
    );

    const newItem = db.get('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      ...newItem,
      note: newItem.notes || '',
      notes: newItem.notes || ''
    });
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
