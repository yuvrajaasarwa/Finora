const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/investments
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM investments WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/investments
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, type, amount, returns, date, notes } = req.body || {};
    if (!name || amount === undefined) {
      return res.status(400).json({ error: 'Name and amount are required' });
    }

    const result = db.run(
      'INSERT INTO investments (user_id, name, type, amount, returns, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        name,
        type || 'Stocks',
        parseFloat(amount),
        parseFloat(returns || 0),
        date || new Date().toISOString().split('T')[0],
        notes || ''
      ]
    );

    const newItem = db.get('SELECT * FROM investments WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// PUT /api/investments/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, amount, returns, notes } = req.body || {};

    const item = db.get('SELECT * FROM investments WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    db.run(
      'UPDATE investments SET name = COALESCE(?, name), type = COALESCE(?, type), amount = COALESCE(?, amount), returns = COALESCE(?, returns), notes = COALESCE(?, notes) WHERE id = ?',
      [
        name !== undefined ? name : null,
        type !== undefined ? type : null,
        amount !== undefined ? parseFloat(amount) : null,
        returns !== undefined ? parseFloat(returns) : null,
        notes !== undefined ? notes : null,
        id
      ]
    );

    const updated = db.get('SELECT * FROM investments WHERE id = ?', [id]);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/investments/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = db.get('SELECT * FROM investments WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    db.run('DELETE FROM investments WHERE id = ?', [id]);
    return res.json({ message: 'Investment deleted', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
