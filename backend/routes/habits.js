const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/habits
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM habits WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, target_days, category } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: 'Habit title is required' });
    }

    const result = db.run(
      'INSERT INTO habits (user_id, title, target_days, category) VALUES (?, ?, ?, ?)',
      [req.user.id, title, parseInt(target_days, 10) || 30, category || 'Financial']
    );

    const newItem = db.get('SELECT * FROM habits WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/:id/complete
router.post('/:id/complete', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = db.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (habit.last_completed === today) {
      return res.json(habit); // Already completed today
    }

    const newCompleted = (habit.completed_days || 0) + 1;
    const newStreak = (habit.streak || 0) + 1;

    db.run(
      'UPDATE habits SET completed_days = ?, streak = ?, last_completed = ? WHERE id = ?',
      [newCompleted, newStreak, today, id]
    );

    const updatedHabit = db.get('SELECT * FROM habits WHERE id = ?', [id]);
    return res.json(updatedHabit);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = db.get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    db.run('DELETE FROM habits WHERE id = ?', [id]);
    return res.json({ message: 'Habit deleted', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
