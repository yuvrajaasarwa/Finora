const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/investments
router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      'SELECT * FROM investments WHERE user_id = ? ORDER BY date DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/investments
router.post('/', async (req, res, next) => {
  try {
    const { asset_name, asset_type, amount_invested, current_value, date } = req.body || {};
    if (!asset_name || !asset_type || amount_invested === undefined || current_value === undefined || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const info = await db.run(
      'INSERT INTO investments (user_id, asset_name, asset_type, amount_invested, current_value, date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        asset_name,
        asset_type,
        Number(amount_invested),
        Number(current_value),
        date,
      ]
    );
    const row = await db.get('SELECT * FROM investments WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/investments/:id -> update current_value
router.patch('/:id', async (req, res, next) => {
  try {
    const { current_value } = req.body || {};
    if (current_value === undefined) {
      return res.status(400).json({ error: 'current_value required' });
    }
    const inv = await db.get(
      'SELECT * FROM investments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!inv) return res.status(404).json({ error: 'Not found' });
    await db.run('UPDATE investments SET current_value = ? WHERE id = ?', [
      Number(current_value),
      inv.id,
    ]);
    const updated = await db.get('SELECT * FROM investments WHERE id = ?', [inv.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/investments/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const info = await db.run(
      'DELETE FROM investments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
