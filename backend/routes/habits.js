const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function calcStreak(logs, frequency) {
  if (!logs.length) return 0;
  const dates = logs.map((l) => l.completed_on).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stepDays = frequency === 'weekly' ? 7 : frequency === 'monthly' ? 30 : 1;
  let streak = 0;
  let expected = new Date(today);

  for (const d of dates) {
    const logDate = new Date(d);
    logDate.setHours(0, 0, 0, 0);
    const diff = Math.round((expected - logDate) / 86400000);
    if (diff === 0) {
      streak += 1;
      expected.setDate(expected.getDate() - stepDays);
    } else if (diff > 0 && diff <= stepDays && streak === 0) {
      streak += 1;
      expected = new Date(logDate);
      expected.setDate(expected.getDate() - stepDays);
    } else {
      break;
    }
  }
  return streak;
}

// GET /api/habits
router.get('/', async (req, res, next) => {
  try {
    const habits = await db.all(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const result = await Promise.all(
      habits.map(async (h) => {
        const logs = await db.all(
          'SELECT completed_on FROM habit_logs WHERE habit_id = ? ORDER BY completed_on DESC',
          [h.id]
        );
        const today = new Date().toISOString().slice(0, 10);
        const completedToday = logs.some((l) => l.completed_on === today);
        return {
          ...h,
          streak: calcStreak(logs, h.frequency),
          total_completions: logs.length,
          completed_today: completedToday,
          recent_logs: logs.slice(0, 10).map((l) => l.completed_on),
        };
      })
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
router.post('/', async (req, res, next) => {
  try {
    const { name, frequency, target_amount } = req.body || {};
    if (!name || !frequency) {
      return res.status(400).json({ error: 'name and frequency are required' });
    }
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be daily, weekly or monthly' });
    }
    const info = await db.run(
      'INSERT INTO habits (user_id, name, frequency, target_amount) VALUES (?, ?, ?, ?)',
      [req.user.id, name, frequency, Number(target_amount) || 0]
    );
    const row = await db.get('SELECT * FROM habits WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/:id/complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const habit = await db.get(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const date = (req.body && req.body.date) || new Date().toISOString().slice(0, 10);
    try {
      await db.run(
        'INSERT INTO habit_logs (habit_id, user_id, completed_on) VALUES (?, ?, ?)',
        [habit.id, req.user.id, date]
      );
    } catch (e) {
      // Already completed for that date - unique constraint. Idempotent.
    }
    const logs = await db.all(
      'SELECT completed_on FROM habit_logs WHERE habit_id = ? ORDER BY completed_on DESC',
      [habit.id]
    );
    res.json({
      ok: true,
      streak: calcStreak(logs, habit.frequency),
      total_completions: logs.length,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const info = await db.run(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
