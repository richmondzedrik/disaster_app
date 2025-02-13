const express = require('express');
const router = express.Router();
const { notifyNewPost } = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// Add rate limiting for notifications
const rateLimit = require('express-rate-limit');
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Test endpoint for notifications
router.post('/test-notification-system', authMiddleware, async (req, res) => {
  try {
    // Test email sending
    await sendEmail({
      to: req.user.email,
      subject: 'Test Notification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Notification</h2>
          <p>This is a test notification from the system.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    });

    // Test database notification
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
      [req.user.userId, 'test', 'Test notification']
    );

    res.json({
      success: true,
      message: 'Notification system test completed successfully',
      details: {
        emailSent: true,
        notificationId: result.insertId,
        recipientEmail: req.user.email
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification system test failed',
      error: error.message
    });
  }
});

router.post('/api/news/notify-subscribers', authMiddleware, notificationLimiter, notifyNewPost);

module.exports = router;