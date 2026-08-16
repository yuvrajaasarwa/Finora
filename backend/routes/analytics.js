const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const incomeRows = db.query('SELECT amount, category FROM income WHERE user_id = ?', [userId]);
    const totalIncome = incomeRows.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const expenseRows = db.query('SELECT amount, category FROM expenses WHERE user_id = ?', [userId]);
    const totalExpenses = expenseRows.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const habits = db.query('SELECT target_days, completed_days FROM habits WHERE user_id = ?', [userId]);
    const activeHabits = habits.length;

    let habitConsistency = 0;
    if (habits.length > 0) {
      const totalTarget = habits.reduce((acc, h) => acc + (h.target_days || 30), 0);
      const totalCompleted = habits.reduce((acc, h) => acc + (h.completed_days || 0), 0);
      habitConsistency = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;
    }

    const goals = db.query('SELECT current_amount FROM goals WHERE user_id = ?', [userId]);
    const totalGoalSavings = goals.reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);

    const investments = db.query('SELECT amount, returns FROM investments WHERE user_id = ?', [userId]);
    const totalInvestments = investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0) + (parseFloat(inv.returns) || 0), 0);

    const netWorth = (totalIncome - totalExpenses) + totalGoalSavings + totalInvestments;

    // Expense category breakdown
    const categoryMap = {};
    expenseRows.forEach(exp => {
      const cat = exp.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(exp.amount) || 0);
    });

    const categoryBreakdown = Object.keys(categoryMap).map(cat => ({
      category: cat,
      amount: categoryMap[cat]
    }));

    return res.json({
      totalIncome,
      totalExpenses,
      netWorth,
      activeHabits,
      habitConsistency,
      totalInvestments,
      categoryBreakdown
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
