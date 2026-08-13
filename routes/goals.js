const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/goals
router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(
      rows.map((g) => ({
        ...g,
        progress_percent: g.target_amount > 0
          ? Math.min(100, Math.round((Number(g.saved_amount || 0) / Number(g.target_amount)) * 100))
          : 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/goals
router.post('/', async (req, res, next) => {
  try {
    const { title, target_amount, deadline, saved_amount } = req.body || {};
    if (!title || target_amount === undefined) {
      return res.status(400).json({ error: 'title and target_amount are required' });
    }
    const target = Number(target_amount);
    if (Number.isNaN(target) || target <= 0) {
      return res.status(400).json({ error: 'target_amount must be greater than 0' });
    }
    const info = await db.run(
      'INSERT INTO goals (user_id, title, target_amount, saved_amount, deadline) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, target, Number(saved_amount) || 0, deadline || null]
    );
    const row = await db.get('SELECT * FROM goals WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/goals/:id/contribute -> add to saved_amount
router.patch('/:id/contribute', async (req, res, next) => {
  try {
    const { amount } = req.body || {};
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }
    const goal = await db.get(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    const newSaved = Number(goal.saved_amount || 0) + amt;
    await db.run('UPDATE goals SET saved_amount = ? WHERE id = ?', [newSaved, goal.id]);
    const updated = await db.get('SELECT * FROM goals WHERE id = ?', [goal.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const info = await db.run(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
