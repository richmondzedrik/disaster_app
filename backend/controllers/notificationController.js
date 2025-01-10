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

    // Send emails to all subscribers
    const emailPromises = users.map(user => {
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
      return sendEmail(emailContent);
    });

    await Promise.all(emailPromises);
    res.json({ success: true, message: 'Notifications sent successfully' });
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
