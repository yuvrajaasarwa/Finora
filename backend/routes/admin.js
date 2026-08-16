const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure user is authenticated and has admin role
router.use(auth);
router.use(auth.adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const userCount = db.get('SELECT COUNT(*) as count FROM users');
    const incomeCount = db.get('SELECT COUNT(*) as count FROM income');
    const expenseCount = db.get('SELECT COUNT(*) as count FROM expenses');
    const habitCount = db.get('SELECT COUNT(*) as count FROM habits');
    const todayISO = new Date().toISOString().split('T')[0];
    const habitsCompletedToday = db.get('SELECT COUNT(*) as count FROM habits WHERE last_completed = ?', [todayISO]);
    const openFeedback = db.get("SELECT COUNT(*) as count FROM feedback WHERE status = 'open' OR status = 'pending'");

    const totalUsers = userCount ? userCount.count : 0;
    const totalHabits = habitCount ? habitCount.count : 0;
    const habitsCompleted = habitsCompletedToday ? habitsCompletedToday.count : 0;
    const feedbackOpen = openFeedback ? openFeedback.count : 0;

    return res.json({
      totalUsers,
      total_users: totalUsers,
      totalIncomeRecords: incomeCount ? incomeCount.count : 0,
      totalExpenseRecords: expenseCount ? expenseCount.count : 0,
      totalHabits,
      total_habits: totalHabits,
      habits_completed_today: habitsCompleted,
      total_habit_completions: habitsCompleted,
      open_feedback: feedbackOpen,
      totalFeedback: feedbackOpen
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const users = db.query(`
      SELECT 
        u.id, u.name, u.email, u.currency, u.role, u.created_at,
        (SELECT COUNT(*) FROM habits WHERE user_id = u.id) as habit_count,
        (SELECT COUNT(*) FROM income WHERE user_id = u.id) as income_count,
        (SELECT COUNT(*) FROM expenses WHERE user_id = u.id) as expense_count
      FROM users u 
      ORDER BY u.id DESC
    `);
    return res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT & PATCH /api/admin/users/:id/role
const handleRoleUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (user or admin) is required' });
    }

    db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updated = db.get('SELECT id, name, email, currency, role, created_at FROM users WHERE id = ?', [id]);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

router.put('/users/:id/role', handleRoleUpdate);
router.patch('/users/:id/role', handleRoleUpdate);

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ message: 'User deleted successfully', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/feedback
router.get('/feedback', async (req, res, next) => {
  try {
    const list = db.query(`
      SELECT 
        f.id, f.user_id, 
        COALESCE(f.user_name, u.name, 'Anonymous User') as user_name, 
        COALESCE(f.user_email, u.email, 'No email provided') as user_email, 
        f.rating, f.message, f.status, f.created_at
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.id DESC
    `);
    return res.json(list);
  } catch (err) {
    next(err);
  }
});

// PUT & PATCH /api/admin/feedback/:id
const handleFeedbackUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    db.run('UPDATE feedback SET status = ? WHERE id = ?', [status || 'reviewed', id]);
    const updated = db.get('SELECT * FROM feedback WHERE id = ?', [id]);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

router.put('/feedback/:id', handleFeedbackUpdate);
router.patch('/feedback/:id', handleFeedbackUpdate);

module.exports = router;
