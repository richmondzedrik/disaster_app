const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const auth = require('../middleware/auth');

// Test like notification
router.post('/test/notifications/like', auth.authMiddleware, async (req, res) => {
  try {
    const { userId, postId, message } = req.body;
    
    // Convert string 'test-user' to actual user ID if testing
    const actualUserId = userId === 'test-user' ? req.user.userId : userId;
    
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
      [actualUserId, 'like', postId, message]
    );

    res.json({
      success: true,
      message: 'Like notification created',
      notificationId: result.insertId
    });
  } catch (error) {
    console.error('Like notification error:', error);     
    res.status(500).json({
      success: false,
      message: 'Failed to create like notification',
      error: error.message
    });
  }
});

// Test post notification
router.post('/test/notifications/post', auth.authMiddleware, async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, reference_id, message, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, 'post', null, message]
    );

    res.json({
      success: true,  
      message: 'Post notification created',
      notificationId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create post notification'
    });
  }
});

// Test alert notification
router.post('/test/notifications/alert', auth.authMiddleware, async (req, res) => {
  try {
    const { userId, alertType, message } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, reference_id, message, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, 'alert', null, message]
    );

    res.json({
      success: true,
      message: 'Alert notification created',
      notificationId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create alert notification'
    });
  }
});

// Verify test notifications
router.get('/test/notifications/verify', auth.authMiddleware, async (req, res) => {
  try {
    // Get test notifications created in the last minute
    const [notifications] = await db.execute(
      `SELECT * FROM notifications 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
       AND user_id = 'test-user'`
    );

    // Clean up test notifications
    await db.execute(
      "DELETE FROM notifications WHERE user_id = 'test-user'"
    );

    const results = {
      like: notifications.some(n => n.type === 'like'),
      post: notifications.some(n => n.type === 'post'),
      alert: notifications.some(n => n.type === 'alert')
    };

    res.json({
      success: true,
      message: 'Notification verification complete',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify notifications'
    });
  }
});

module.exports = router;
