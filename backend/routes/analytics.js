const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const incomeRows = db.query('SELECT amount, category, date FROM income WHERE user_id = ?', [userId]);
    const totalIncome = incomeRows.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const expenseRows = db.query('SELECT amount, category, date FROM expenses WHERE user_id = ?', [userId]);
    const totalExpenses = expenseRows.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const habits = db.query('SELECT target_days, completed_days, last_completed FROM habits WHERE user_id = ?', [userId]);
    const habitCount = habits.length;
    const today = new Date().toISOString().split('T')[0];
    const habitsCompletedToday = habits.filter(h => h.last_completed === today).length;

    let habitConsistency = 0;
    if (habits.length > 0) {
      const totalTarget = habits.reduce((acc, h) => acc + (h.target_days || 30), 0);
      const totalCompleted = habits.reduce((acc, h) => acc + (h.completed_days || 0), 0);
      habitConsistency = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;
    }

    const goals = db.query('SELECT current_amount FROM goals WHERE user_id = ?', [userId]);
    const totalGoalSavings = goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);

    const investments = db.query('SELECT amount, returns FROM investments WHERE user_id = ?', [userId]);
    const totalInvestments = investments.reduce((sum, inv) => {
      const amt = parseFloat(inv.amount || 0);
      const ret = parseFloat(inv.returns || 0);
      return sum + amt + ret;
    }, 0);

    const netCashSavings = totalIncome - totalExpenses;
    const netWorth = netCashSavings + totalGoalSavings + totalInvestments;

    // Expense category breakdown
    const categoryMap = {};
    expenseRows.forEach(exp => {
      const cat = exp.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(exp.amount) || 0);
    });

    const categoryBreakdown = Object.keys(categoryMap).map(cat => ({
      category: cat,
      amount: categoryMap[cat],
      total: categoryMap[cat]
    }));

    // Monthly breakdown
    const monthMap = {};
    incomeRows.forEach(item => {
      if (item.date) {
        const m = item.date.substring(0, 7);
        if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0 };
        monthMap[m].income += parseFloat(item.amount) || 0;
      }
    });

    expenseRows.forEach(item => {
      if (item.date) {
        const m = item.date.substring(0, 7);
        if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0 };
        monthMap[m].expense += parseFloat(item.amount) || 0;
      }
    });

    const currentMonthStr = today.substring(0, 7);
    if (!monthMap[currentMonthStr]) {
      monthMap[currentMonthStr] = { month: currentMonthStr, income: totalIncome, expense: totalExpenses };
    }

    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    return res.json({
      // camelCase
      totalIncome,
      totalExpenses,
      netWorth,
      activeHabits: habitCount,
      habitConsistency,
      totalInvestments,
      categoryBreakdown,

      // snake_case
      total_income: totalIncome,
      total_expense: totalExpenses,
      net_worth: netWorth,
      net_cash_savings: netCashSavings,
      investments_current_value: totalInvestments,
      total_saved_in_goals: totalGoalSavings,
      habits_completed_today: habitsCompletedToday,
      habit_count: habitCount,
      monthly,
      category_breakdown: categoryBreakdown
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
