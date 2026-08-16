const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/goals
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/goals
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, target_amount, current_amount, target_date, category } = req.body || {};
    if (!title || target_amount === undefined) {
      return res.status(400).json({ error: 'Title and target_amount are required' });
    }

    const result = db.run(
      'INSERT INTO goals (user_id, title, target_amount, current_amount, target_date, category) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        title,
        parseFloat(target_amount),
        parseFloat(current_amount || 0),
        target_date || null,
        category || 'Savings'
      ]
    );

    const newItem = db.get('SELECT * FROM goals WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// POST /api/goals/:id/contribute
router.post('/:id/contribute', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body || {};
    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Valid contribution amount is required' });
    }

    const goal = db.get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const newCurrent = (goal.current_amount || 0) + parseFloat(amount);
    db.run('UPDATE goals SET current_amount = ? WHERE id = ?', [newCurrent, id]);

    const updatedGoal = db.get('SELECT * FROM goals WHERE id = ?', [id]);
    return res.json(updatedGoal);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const goal = db.get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    db.run('DELETE FROM goals WHERE id = ?', [id]);
    return res.json({ message: 'Goal deleted', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
