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
    const feedbackCount = db.get('SELECT COUNT(*) as count FROM feedback');

    return res.json({
      totalUsers: userCount ? userCount.count : 0,
      totalIncomeRecords: incomeCount ? incomeCount.count : 0,
      totalExpenseRecords: expenseCount ? expenseCount.count : 0,
      totalHabits: habitCount ? habitCount.count : 0,
      totalFeedback: feedbackCount ? feedbackCount.count : 0
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const users = db.query('SELECT id, name, email, currency, role, created_at FROM users ORDER BY id DESC');
    return res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res, next) => {
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
});

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
    const list = db.query('SELECT * FROM feedback ORDER BY id DESC');
    return res.json(list);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/feedback/:id
router.put('/feedback/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    db.run('UPDATE feedback SET status = ? WHERE id = ?', [status || 'reviewed', id]);
    const updated = db.get('SELECT * FROM feedback WHERE id = ?', [id]);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
