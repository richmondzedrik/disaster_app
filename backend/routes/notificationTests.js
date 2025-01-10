const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

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

// Add to your backend routes file (e.g., routes/notification.js or similar)
router.post('/notifications/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    await sendEmail({
      to: email,
      subject: 'Test Email from Disaster Prep App',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Test Email</h1>
          <p>This is a test email to verify the email service is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    });

    return res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    });
  }
});

router.post('/test/notifications/post-created', auth.authMiddleware, async (req, res) => {
  try {
    const { email, title, content, author } = req.body;
    
    if (!email || !title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Send email notification
    await sendEmail({
      to: email,
      subject: `New Post Created: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>New Post Created</h1>
          <h2>${title}</h2>
          <p>Author: ${author}</p>
          <p>${content}</p>
          <p>View the post on our platform:</p>
          <a href="${process.env.FRONTEND_URL}/news" 
             style="padding: 10px 20px; background: #00D1D1; color: white; 
                    text-decoration: none; border-radius: 5px;">
            View Post
          </a>
        </div>
      `
    });

    // Create notification record
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
      [req.user.userId, 'post_created', `New post created: ${title}`]
    );

    return res.json({
      success: true,
      message: 'Post creation notification sent successfully',
      notificationId: result.insertId
    });
  } catch (error) {
    console.error('Post creation notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send post creation notification',
      error: error.message
    });
  }
});

module.exports = router;
