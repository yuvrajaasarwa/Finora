const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'wealthpulse_production_jwt_fallback_secret_key_2026';

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const info = await db.run(
      'INSERT INTO users (name, email, password_hash, role, currency) VALUES (?, ?, ?, ?, ?)',
      [name, normalizedEmail, hash, 'user', currency || 'INR']
    );
    const user = await db.get(
      'SELECT id, name, email, role, currency FROM users WHERE id = ?',
      [info.lastInsertRowid]
    );
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const row = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [String(email).trim().toLowerCase()]
    );
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      currency: row.currency,
    };
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, role, currency, phone, monthly_income_target, monthly_savings_target, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ user: user || req.user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, email, currency, phone, monthly_income_target, monthly_savings_target } = req.body || {};
    const uid = req.user.id;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [normalizedEmail, uid]);
    if (existing) {
      return res.status(409).json({ error: 'Email is already used by another account' });
    }

    await db.run(
      `UPDATE users SET name = ?, email = ?, currency = ?, phone = ?, monthly_income_target = ?, monthly_savings_target = ? WHERE id = ?`,
      [
        name,
        normalizedEmail,
        currency || 'INR',
        phone || '',
        Number(monthly_income_target || 62000),
        Number(monthly_savings_target || 20000),
        uid,
      ]
    );

    const updatedUser = await db.get(
      'SELECT id, name, email, role, currency, phone, monthly_income_target, monthly_savings_target FROM users WHERE id = ?',
      [uid]
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const row = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/export-data (GDPR Compliance Data Export)
router.get('/export-data', auth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    const user = await db.get('SELECT id, name, email, role, currency, created_at FROM users WHERE id = ?', [uid]);
    const income = await db.all('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC', [uid]);
    const expenses = await db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [uid]);
    const habits = await db.all('SELECT * FROM habits WHERE user_id = ?', [uid]);
    const habitLogs = await db.all('SELECT * FROM habit_logs WHERE user_id = ?', [uid]);
    const goals = await db.all('SELECT * FROM goals WHERE user_id = ?', [uid]);
    const investments = await db.all('SELECT * FROM investments WHERE user_id = ?', [uid]);

    const exportObject = {
      platform: 'Financial Habit Builder & Wealth Growth Tracker (Finora)',
      exportDate: new Date().toISOString(),
      user,
      income,
      expenses,
      habits,
      habitLogs,
      goals,
      investments,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="wealthpulse_user_data_${uid}.json"`);
    res.json(exportObject);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/delete-account (GDPR Right to be Forgotten)
router.delete('/delete-account', auth, async (req, res, next) => {
  try {
    const uid = req.user.id;
    await db.run('DELETE FROM income WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM expenses WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM habit_logs WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM habits WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM goals WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM investments WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM feedback WHERE user_id = ?', [uid]);
    await db.run('DELETE FROM users WHERE id = ?', [uid]);

    res.json({ success: true, message: 'Account and all associated personal data successfully deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

