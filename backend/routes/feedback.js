const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/feedback
router.post('/', async (req, res, next) => {
  try {
    const { message, rating, user_name, user_email } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Feedback message is required' });
    }

    const result = db.run(
      'INSERT INTO feedback (user_name, user_email, rating, message, status) VALUES (?, ?, ?, ?, ?)',
      [user_name || 'Anonymous', user_email || '', parseInt(rating, 10) || 5, message, 'pending']
    );

    const newItem = db.get('SELECT * FROM feedback WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: newItem
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
