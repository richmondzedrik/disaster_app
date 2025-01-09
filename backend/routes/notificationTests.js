const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Test like notification
router.post('/notifications/like', auth.authMiddleware, async (req, res) => {
  try {
    const { postId, action } = req.body;
    
    // Simulate creating a test notification
    const testNotification = {
      id: Date.now(),
      type: 'like',
      message: `Test: Someone liked your post`,
      timestamp: new Date(),
      read: false
    };

    res.json({
      success: true,
      message: 'Like notification test successful',
      notification: testNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Like notification test failed'
    });
  }
});

// Test new post notification
router.post('/notifications/post', auth.authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    
    const testNotification = {
      id: Date.now(),
      type: 'post',
      message: `Test: New post created: ${title}`,
      timestamp: new Date(),
      read: false
    };

    res.json({
      success: true,
      message: 'Post notification test successful',
      notification: testNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Post notification test failed'
    });
  }
});

// Test alert notification
router.post('/notifications/alert', auth.authMiddleware, async (req, res) => {
  try {
    const { type, message } = req.body;
    
    const testNotification = {
      id: Date.now(),
      type: 'alert',
      message: `Test: New ${type} alert - ${message}`,
      timestamp: new Date(),
      read: false
    };

    res.json({
      success: true,
      message: 'Alert notification test successful',
      notification: testNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Alert notification test failed'
    });
  }
});

module.exports = router;
