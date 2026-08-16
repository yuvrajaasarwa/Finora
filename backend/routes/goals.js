const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function formatGoal(g) {
  const current = parseFloat(g.current_amount !== undefined && g.current_amount !== null ? g.current_amount : (g.saved_amount || 0));
  const target = parseFloat(g.target_amount || 0);
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const dateStr = g.target_date || g.deadline || null;
  return {
    ...g,
    saved_amount: current,
    current_amount: current,
    target_amount: target,
    target_date: dateStr,
    deadline: dateStr,
    progress_percent: percent
  };
}

// GET /api/goals
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    return res.json(rows.map(formatGoal));
  } catch (err) {
    next(err);
  }
});

// POST /api/goals
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, target_amount, current_amount, saved_amount, target_date, deadline, category } = req.body || {};
    if (!title || target_amount === undefined || target_amount === null || target_amount === '') {
      return res.status(400).json({ error: 'Title and target_amount are required' });
    }

    const currentVal = parseFloat(current_amount || saved_amount || 0);
    const dateVal = target_date || deadline || null;

    const result = db.run(
      'INSERT INTO goals (user_id, title, target_amount, current_amount, target_date, category) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        title,
        parseFloat(target_amount),
        currentVal,
        dateVal,
        category || 'Savings'
      ]
    );

    const newItem = db.get('SELECT * FROM goals WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(formatGoal(newItem));
  } catch (err) {
    next(err);
  }
});

// Contribute handler for both POST and PATCH /api/goals/:id/contribute
async function handleContribute(req, res, next) {
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

    const newCurrent = parseFloat(goal.current_amount || goal.saved_amount || 0) + parseFloat(amount);
    db.run('UPDATE goals SET current_amount = ? WHERE id = ?', [newCurrent, id]);

    const updatedGoal = db.get('SELECT * FROM goals WHERE id = ?', [id]);
    return res.json(formatGoal(updatedGoal));
  } catch (err) {
    next(err);
  }
}

router.post('/:id/contribute', auth, handleContribute);
router.patch('/:id/contribute', auth, handleContribute);

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
