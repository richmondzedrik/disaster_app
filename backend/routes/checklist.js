const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/connection');

// Load checklist progress
router.get('/progress', auth.authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Loading checklist for user:', userId);
    
    // Get both default and custom items
    const [items] = await db.execute(`
      SELECT 
        ci.item_id,
        COALESCE(cp.completed, false) as completed,
        ci.text,
        ci.category,  
        ci.info,
        CASE 
          WHEN ci.user_id = ? THEN true
          ELSE false
        END as is_custom
      FROM checklist_items ci
      LEFT JOIN checklist_progress cp 
        ON ci.item_id = cp.item_id 
        AND cp.user_id = ?
      WHERE ci.user_id = 1 OR ci.user_id = ?
    `, [userId, userId, userId]);

    const formattedItems = items.map(row => ({
      id: row.item_id,
      completed: Boolean(row.completed),
      text: row.text,
      category: row.category,
      info: row.info,
      isCustom: Boolean(row.is_custom)
    }));

    console.log('Loaded items:', formattedItems);
    res.json({ success: true, items: formattedItems });
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
    
    console.log('Adding custom item:', { userId, item });

    // Validate required fields
    if (!item?.text || !item?.category || !item?.id) {
      console.log('Validation failed:', { item });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        details: {
          hasText: Boolean(item?.text),
          hasCategory: Boolean(item?.category),
          hasId: Boolean(item?.id)
        }
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into checklist_items
      await connection.execute(
        'INSERT INTO checklist_items (user_id, item_id, text, category, info) VALUES (?, ?, ?, ?, ?)',
        [userId, item.id, item.text, item.category, item.info || null]
      );

      // Insert into checklist_progress
      await connection.execute(
        'INSERT INTO checklist_progress (user_id, item_id, completed) VALUES (?, ?, ?)',
        [userId, item.id, false]
      );

      await connection.commit();
      
      console.log('Custom item added successfully:', { userId, itemId: item.id });

      res.json({ 
        success: true, 
        message: 'Custom item added successfully',
        item: {
          ...item,
          completed: false
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add custom item error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.userId
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add custom item',
      error: error.message
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