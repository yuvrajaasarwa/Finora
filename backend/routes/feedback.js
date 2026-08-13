const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback  (auth required)
router.post('/', auth, async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const info = await db.run(
      'INSERT INTO feedback (user_id, message) VALUES (?, ?)',
      [req.user.id, message.trim()]
    );
    res.status(201).json({ id: info.lastInsertRowid, ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
