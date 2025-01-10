const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const db = require('../db/connection');

const notifyNewPost = async (req, res) => {
  try {
    const { postId, title, content, author } = req.body;
    
    if (!postId || !title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for notification',
        details: { postId, title, content, author }
      });
    }

    // Get all users with notifications enabled
    const [users] = await db.execute(
      'SELECT email FROM users WHERE notifications = true AND email_verified = true'
    );

    if (!users || users.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No subscribers found to notify',
        details: { subscriberCount: 0 }
      });
    }

    // Send emails to all subscribers with detailed error tracking
    const emailResults = await Promise.allSettled(users.map(user => {
      return sendEmail({
        to: user.email,
        subject: 'New Post on AlertoAbra: ' + title,
        html: `
          <h2>New Post from ${author}</h2>
          <h3>${title}</h3>
          <p>${content}</p>
          <p>Click below to read the full post:</p>
          <a href="${process.env.FRONTEND_URL}/news" 
             style="padding: 10px 20px; background: #00D1D1; color: white; 
                    text-decoration: none; border-radius: 5px;">
            Read More
          </a>
        `
      }).catch(error => ({
        error: error.message,
        email: user.email
      }));
    }));

    const successfulEmails = emailResults.filter(result => result.status === 'fulfilled');
    const failedEmails = emailResults.filter(result => result.status === 'rejected');

    // Log detailed results
    console.log('Notification Results:', {
      total: users.length,
      successful: successfulEmails.length,
      failed: failedEmails.length,
      failedDetails: failedEmails.map(f => f.reason)
    });

    if (successfulEmails.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send any notifications',
        details: {
          attempted: users.length,
          succeeded: 0,
          failed: failedEmails.length,
          errors: failedEmails.map(f => f.reason)
        }
      });
    }

    res.json({
      success: true,
      message: `Notifications sent: ${successfulEmails.length} successful, ${failedEmails.length} failed`,
      details: {
        attempted: users.length,
        succeeded: successfulEmails.length,
        failed: failedEmails.length
      }
    });
  } catch (error) {
    console.error('Notification system error:', error);
    res.status(500).json({
      success: false,
      message: 'Notification system error',
      error: error.message
    });
  }
};

module.exports = {
  notifyNewPost
};
