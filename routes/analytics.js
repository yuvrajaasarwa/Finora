const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/analytics/summary
router.get('/summary', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const incomeRow = await db.get('SELECT COALESCE(SUM(amount),0) as v FROM income WHERE user_id = ?', [uid]);
    const expenseRow = await db.get('SELECT COALESCE(SUM(amount),0) as v FROM expenses WHERE user_id = ?', [uid]);
    const goalsRow = await db.get('SELECT COALESCE(SUM(saved_amount),0) as v FROM goals WHERE user_id = ?', [uid]);
    const investmentsRow = await db.get(
      'SELECT COALESCE(SUM(amount_invested),0) as inv, COALESCE(SUM(current_value),0) as cur FROM investments WHERE user_id = ?',
      [uid]
    );

    const totalIncome = incomeRow ? Number(incomeRow.v || 0) : 0;
    const totalExpense = expenseRow ? Number(expenseRow.v || 0) : 0;
    const totalSavedGoals = goalsRow ? Number(goalsRow.v || 0) : 0;
    const inv = investmentsRow ? Number(investmentsRow.inv || 0) : 0;
    const cur = investmentsRow ? Number(investmentsRow.cur || 0) : 0;

    const netCashSavings = totalIncome - totalExpense;
    const netWorth = netCashSavings + cur;

    const monthly = await db.all(
      `SELECT substr(date,1,7) as month,
              SUM(CASE WHEN kind='income' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN kind='expense' THEN amount ELSE 0 END) as expense
       FROM (
          SELECT date, amount, 'income' as kind FROM income WHERE user_id = ?
          UNION ALL
          SELECT date, amount, 'expense' as kind FROM expenses WHERE user_id = ?
       )
       GROUP BY month
       ORDER BY month ASC`,
      [uid, uid]
    );

    const categoryBreakdown = await db.all(
      `SELECT category, SUM(amount) as total FROM expenses
       WHERE user_id = ?
       GROUP BY category
       ORDER BY total DESC`,
      [uid]
    );

    const habitCountRow = await db.get('SELECT COUNT(*) as c FROM habits WHERE user_id = ?', [uid]);
    const habitCount = habitCountRow ? Number(habitCountRow.c || 0) : 0;

    const today = new Date().toISOString().slice(0, 10);
    const habitsCompletedTodayRow = await db.get(
      'SELECT COUNT(DISTINCT habit_id) as c FROM habit_logs WHERE user_id = ? AND completed_on = ?',
      [uid, today]
    );
    const habitsCompletedToday = habitsCompletedTodayRow ? Number(habitsCompletedTodayRow.c || 0) : 0;

    res.json({
      total_income: totalIncome,
      total_expense: totalExpense,
      net_cash_savings: netCashSavings,
      total_invested: inv,
      investments_current_value: cur,
      total_saved_in_goals: totalSavedGoals,
      net_worth: netWorth,
      monthly,
      category_breakdown: categoryBreakdown,
      habit_count: habitCount,
      habits_completed_today: habitsCompletedToday,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

