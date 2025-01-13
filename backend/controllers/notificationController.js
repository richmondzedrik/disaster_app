const User = require('../models/User');
const emailService = require('../services/emailService');
const db = require('../db/connection');

const notifyNewPost = async (req, res) => {
  try {
    const { postId, title, content, author, status, isAdmin } = req.body;
    
    console.log('Notification request received:', { postId, title, author, status, isAdmin });
    
    // For admin posts, send notification immediately
    // For verified users, only send when post is approved
    if (!isAdmin && status !== 'approved') {
      return res.json({
        success: true,
        message: 'Post pending approval - notifications will be sent upon approval',
        details: { notificationsSent: false }
      });
    }

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
      'SELECT email, id FROM users WHERE email_verified = true AND (notifications IS NULL OR notifications = true)'
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
        await emailService.sendEmail({
          to: user.email,
          subject: `New Post Created: ${title}`,
          html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.FRONTEND_URL}/logo.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
                <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">New Post Alert! 📢</h1>
              </div>
              
              <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <h2 style="color: #00D1D1; margin-top: 0; margin-bottom: 15px; font-size: 20px;">${title}</h2>
                
                <div style="color: #666; margin-bottom: 15px; font-size: 14px;">
                  <span style="color: #4052D6;">Author:</span> ${author}
                </div>
                
                <div style="color: #2c3e50; line-height: 1.6; margin-bottom: 25px; border-left: 3px solid #00D1D1; padding-left: 15px;">
                  ${content.length > 300 ? content.substring(0, 300) + '...' : content}
                </div>
                
                <a href="${process.env.FRONTEND_URL}/news" 
                   style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%); 
                          color: white; text-decoration: none; border-radius: 6px; font-weight: bold; 
                          box-shadow: 0 2px 4px rgba(0,209,209,0.2);">
                  Read Full Post
                </a>
              </div>
              
              <div style="text-align: center; color: #666; font-size: 12px;">
                <p>You received this email because you're subscribed to post notifications.</p>
                <p>To unsubscribe, visit your <a href="${process.env.FRONTEND_URL}/profile#notifications" 
                   style="color: #00D1D1; text-decoration: none;">notification settings</a>.</p>
              </div>
            </div>
          `
        });
        
        // Create notification record
        await db.execute(
          'INSERT INTO notifications (user_id, type, message, created_at) VALUES (?, ?, ?, NOW())',
          [user.id, 'post', `New post created: ${title}`]
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

    console.log('Notification Results:', {
      total: users.length,
      successful: successfulEmails.length,
      failed: failedEmails.length,
      failedDetails: failedEmails.map(f => f.value?.error || f.reason)
    });

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
