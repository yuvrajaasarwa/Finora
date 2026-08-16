const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function formatInvestment(r) {
  const name = r.asset_name || r.name || 'Investment';
  const type = r.asset_type || r.type || 'Stocks';
  const amt = parseFloat(r.amount !== undefined && r.amount !== null ? r.amount : (r.amount_invested || 0));
  const ret = parseFloat(r.returns || 0);
  const cur = r.current_value !== undefined && r.current_value !== null
    ? parseFloat(r.current_value)
    : (amt + ret);

  return {
    ...r,
    name,
    asset_name: name,
    type,
    asset_type: type,
    amount: amt,
    amount_invested: amt,
    returns: cur - amt,
    current_value: cur
  };
}

// GET /api/investments
router.get('/', auth, async (req, res, next) => {
  try {
    const rows = db.query('SELECT * FROM investments WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    return res.json(rows.map(formatInvestment));
  } catch (err) {
    next(err);
  }
});

// POST /api/investments
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, asset_name, type, asset_type, amount, amount_invested, current_value, returns, date, notes } = req.body || {};
    const itemTitle = asset_name || name;
    const itemType = asset_type || type || 'Stocks';
    const itemAmt = amount_invested !== undefined ? amount_invested : amount;

    if (!itemTitle || itemAmt === undefined || itemAmt === null || itemAmt === '') {
      return res.status(400).json({ error: 'Name and amount are required' });
    }

    const numAmount = parseFloat(itemAmt);
    const curVal = current_value !== undefined ? parseFloat(current_value) : (numAmount + parseFloat(returns || 0));
    const retVal = curVal - numAmount;

    const result = db.run(
      'INSERT INTO investments (user_id, name, type, amount, returns, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        itemTitle,
        itemType,
        numAmount,
        retVal,
        date || new Date().toISOString().split('T')[0],
        notes || ''
      ]
    );

    const newItem = db.get('SELECT * FROM investments WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json(formatInvestment({ ...newItem, current_value: curVal }));
  } catch (err) {
    next(err);
  }
});

// PUT & PATCH /api/investments/:id
async function handleUpdate(req, res, next) {
  try {
    const { id } = req.params;
    const { name, asset_name, type, asset_type, amount, amount_invested, current_value, returns, notes } = req.body || {};

    const item = db.get('SELECT * FROM investments WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const newName = asset_name || name || item.name;
    const newType = asset_type || type || item.type;
    const newAmount = amount_invested !== undefined ? parseFloat(amount_invested) : (amount !== undefined ? parseFloat(amount) : parseFloat(item.amount || 0));
    
    let newReturns = item.returns;
    if (current_value !== undefined) {
      newReturns = parseFloat(current_value) - newAmount;
    } else if (returns !== undefined) {
      newReturns = parseFloat(returns);
    }

    db.run(
      'UPDATE investments SET name = ?, type = ?, amount = ?, returns = ?, notes = COALESCE(?, notes) WHERE id = ?',
      [newName, newType, newAmount, newReturns, notes !== undefined ? notes : null, id]
    );

    const updated = db.get('SELECT * FROM investments WHERE id = ?', [id]);
    return res.json(formatInvestment(updated));
  } catch (err) {
    next(err);
  }
}

router.put('/:id', auth, handleUpdate);
router.patch('/:id', auth, handleUpdate);

// DELETE /api/investments/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = db.get('SELECT * FROM investments WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    db.run('DELETE FROM investments WHERE id = ?', [id]);
    return res.json({ message: 'Investment deleted', id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
