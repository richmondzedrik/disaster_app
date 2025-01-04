const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/connection');

// Load checklist progress
router.get('/progress', auth.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get both custom and default items progress
    const [rows] = await db.execute(`
      SELECT cp.item_id, cp.completed, ci.text, ci.category, ci.info, 
      CASE WHEN ci.user_id IS NOT NULL THEN 1 ELSE 0 END as is_custom
      FROM checklist_progress cp
      LEFT JOIN checklist_items ci 
      ON cp.item_id = ci.item_id AND cp.user_id = ci.user_id
      WHERE cp.user_id = ?
    `, [userId]);

    const items = rows.map(row => ({
      id: row.item_id,
      completed: Boolean(row.completed),
      text: row.text,
      category: row.category,
      info: row.info,
      isCustom: Boolean(row.is_custom)
    }));

    res.json({ success: true, items });
  } catch (error) {
    console.error('Load checklist error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load progress',
      error: error.message 
    });
  }
});

// Update individual item progress
router.post('/progress', auth.authMiddleware, async (req, res) => {
  try {
    const { item } = req.body;
    
    if (!item || !item.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: item ID is required'
      });
    }

    const userId = req.user.userId;

    await db.execute(
      'INSERT INTO checklist_progress (user_id, item_id, completed) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE completed = VALUES(completed)',
      [userId, item.id, item.completed]
    );

    res.json({ 
      success: true, 
      message: 'Progress updated successfully',
      item: {
        id: item.id,
        completed: item.completed
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update progress' 
    });
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

    // Validate required fields
    if (!item?.text || !item?.category || !item?.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Insert into checklist_items
    await db.execute(
      'INSERT INTO checklist_items (user_id, item_id, text, category, info) VALUES (?, ?, ?, ?, ?)',
      [userId, item.id, item.text, item.category, item.info || null]
    );

    // Also insert into checklist_progress to track completion
    await db.execute(
      'INSERT INTO checklist_progress (user_id, item_id, completed) VALUES (?, ?, ?)',
      [userId, item.id, false]
    );

    res.json({ 
      success: true, 
      message: 'Custom item added successfully',
      item: {
        ...item,
        completed: false
      }
    });
  } catch (error) {
    console.error('Add custom item error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add custom item' 
    });
  }
});

// Delete custom item
router.delete('/custom/:itemId', auth.authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    // Delete from checklist_items and checklist_progress
    await db.execute(
      'DELETE FROM checklist_items WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );
    await db.execute(
      'DELETE FROM checklist_progress WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

// Update custom item
router.put('/custom/:itemId', auth.authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { item } = req.body;
    const userId = req.user.userId;

    await db.execute(
      'UPDATE checklist_items SET text = ?, category = ?, info = ? WHERE user_id = ? AND item_id = ?',
      [item.text, item.category, item.info, userId, itemId]
    );

    res.json({ 
      success: true, 
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Checklist service is operational' 
  });
}); 

module.exports = router;  