const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const db = require('../db/connection');

const notifyNewPost = async (req, res) => {
  try {
    const { postId, title, content, author } = req.body;
    
    // Get all users with notifications enabled
    const [users] = await db.execute(
      'SELECT email FROM users WHERE notifications = true AND email_verified = true'
    );

    console.log('Found subscribers:', users); // Debug log

    if (!users || users.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No subscribers found' 
      });
    }

    // Send emails to all subscribers
    const emailPromises = users.map(user => {
      console.log('Sending email to:', user.email); // Debug log
      const emailContent = {
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
      };
      return sendEmail(emailContent).catch(err => {
        console.error('Email send error:', err);
        return null;
      });
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(Boolean).length;

    res.json({ 
      success: true, 
      message: `Notifications sent successfully to ${successCount} subscribers` 
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notifications' 
    });
  }
};

module.exports = {
  notifyNewPost
};
