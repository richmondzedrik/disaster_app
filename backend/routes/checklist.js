const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/connection');

// Load checklist progress
router.get('/progress', auth.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Loading progress for user:', userId); // Debug log
    
    const [rows] = await db.execute(
      'SELECT item_id, completed FROM checklist_progress WHERE user_id = ?',
      [userId]
    );

    const items = rows.map(row => ({
      id: row.item_id,
      completed: row.completed === 1
    }));

    res.json({ success: true, items });
  } catch (error) {
    console.error('Load checklist error:', error);
    res.status(500).json({ success: false, message: 'Failed to load progress' });
  }
});

// Update individual item progress
router.post('/progress', auth.authMiddleware, async (req, res) => {
  try {
    const { item } = req.body;
    const userId = req.user.userId;

    await db.execute(
      'INSERT INTO checklist_progress (user_id, item_id, completed) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE completed = VALUES(completed)',
      [userId, item.id, item.completed]
    );

    res.json({ success: true, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
});

// Save all checklist items
router.post('/save', auth.authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    // First, delete existing progress for this user
    await db.execute('DELETE FROM checklist_progress WHERE user_id = ?', [userId]);

    // Insert new progress for all items
    const values = items.map(item => [userId, item.id, item.completed]);
    await db.execute(
      'INSERT INTO checklist_progress (user_id, item_id, completed) VALUES ?',
      [values]
    );

    res.json({ success: true, message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Save checklist error:', error);
    res.status(500).json({ success: false, message: 'Failed to save progress' });
  }
});

// Add custom items
router.post('/custom', auth.authMiddleware, async (req, res) => {
  try {
    const { item } = req.body;
    const userId = req.user.userId;

    await db.execute(
      'INSERT INTO checklist_items (user_id, item_id, text, category, info) VALUES (?, ?, ?, ?, ?)',
      [userId, item.id, item.text, item.category, item.info]
    );

    res.json({ success: true, message: 'Custom item added successfully' });
  } catch (error) {
    console.error('Add custom item error:', error);
    res.status(500).json({ success: false, message: 'Failed to add custom item' });
  }
});

router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Checklist service is operational' 
  });
});

module.exports = router;