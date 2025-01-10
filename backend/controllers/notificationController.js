const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const db = require('../db/connection');

const notifyNewPost = async (req, res) => {
  try {
    const { postId, title, content, author } = req.body;
    
    // Add more detailed logging
    console.log('Notification request received:', { postId, title, author });
    
    if (!postId || !title || !content || !author) {
      console.log('Missing fields:', { postId, title, content, author });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for notification',
        details: { postId, title, content, author }
      });
    }

    // Get all users with notifications enabled
    const [users] = await db.execute(
      'SELECT email, id FROM users WHERE notifications = true AND email_verified = true AND status = "active"'
    );

    console.log(`Found ${users.length} subscribers to notify`);

    if (!users || users.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No active subscribers found to notify',
        details: { subscriberCount: 0 }
      });
    }

    // Send emails with better error handling
    const emailResults = await Promise.allSettled(users.map(async user => {
      try {
        const result = await sendEmail({
          to: user.email,
          subject: 'New Post on AlertoAbra: ' + title,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>New Post from ${author}</h2>
              <h3>${title}</h3>
              <p>${content}</p>
              <p>Click below to read the full post:</p>
              <a href="${process.env.FRONTEND_URL}/news" 
                 style="padding: 10px 20px; background: #00D1D1; color: white; 
                        text-decoration: none; border-radius: 5px;">
                Read More
              </a>
            </div>
          `
        });
        
        // Create notification record in database
        await db.execute(
          'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
          [user.id, 'post_created', `New post: ${title}`]
        );

        return { success: true, email: user.email };
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return { success: false, email: user.email, error: error.message };
      }
    }));

    const successfulEmails = emailResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );
    const failedEmails = emailResults.filter(result => 
      result.status === 'rejected' || !result.value.success
    );

    // Log detailed results
    console.log('Notification Results:', {
      total: users.length,
      successful: successfulEmails.length,
      failed: failedEmails.length,
      failedDetails: failedEmails.map(f => f.value?.error || f.reason)
    });

    // Consider partial success as success
    res.json({
      success: successfulEmails.length > 0,
      message: `Notifications sent: ${successfulEmails.length} successful, ${failedEmails.length} failed`,
      details: {
        attempted: users.length,
        succeeded: successfulEmails.length,
        failed: failedEmails.length,
        errors: failedEmails.map(f => f.value?.error || f.reason)
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
