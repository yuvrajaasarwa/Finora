const express = require('express');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const usersRow = await db.get('SELECT COUNT(*) as c FROM users');
    const incomeRow = await db.get('SELECT COALESCE(SUM(amount),0) as v FROM income');
    const expenseRow = await db.get('SELECT COALESCE(SUM(amount),0) as v FROM expenses');
    const goalsRow = await db.get('SELECT COUNT(*) as c FROM goals');
    const habitsRow = await db.get('SELECT COUNT(*) as c FROM habits');
    const completedHabitsRow = await db.get('SELECT COUNT(*) as c FROM habit_logs');
    const today = new Date().toISOString().slice(0, 10);
    const completedTodayRow = await db.get('SELECT COUNT(*) as c FROM habit_logs WHERE completed_on = ?', [today]);
    const feedbackRow = await db.get('SELECT COUNT(*) as c FROM feedback WHERE status = ?', ['open']);

    const users = usersRow ? Number(usersRow.c || 0) : 0;
    res.json({
      users,
      total_users: users,
      total_income: incomeRow ? Number(incomeRow.v || 0) : 0,
      total_expense: expenseRow ? Number(expenseRow.v || 0) : 0,
      total_goals: goalsRow ? Number(goalsRow.c || 0) : 0,
      total_habits: habitsRow ? Number(habitsRow.c || 0) : 0,
      total_habit_completions: completedHabitsRow ? Number(completedHabitsRow.c || 0) : 0,
      habits_completed_today: completedTodayRow ? Number(completedTodayRow.c || 0) : 0,
      open_feedback: feedbackRow ? Number(feedbackRow.c || 0) : 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT u.id, u.name, u.email, u.role, u.currency, u.created_at,
              (SELECT COUNT(*) FROM income WHERE user_id = u.id) as income_count,
              (SELECT COUNT(*) FROM expenses WHERE user_id = u.id) as expense_count,
              (SELECT COUNT(*) FROM habits WHERE user_id = u.id) as habit_count,
              (SELECT COUNT(*) FROM goals WHERE user_id = u.id) as goal_count
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be user or admin' });
    }
    if (Number(req.params.id) === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove admin privileges from your own account' });
    }
    const info = await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, role });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }
    const info = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/feedback
router.get('/feedback', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT f.*, u.name as user_name, u.email as user_email
       FROM feedback f LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/feedback/:id -> resolve
router.patch('/feedback/:id', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!status || !['open', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'status must be open or resolved' });
    }
    await db.run('UPDATE feedback SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
