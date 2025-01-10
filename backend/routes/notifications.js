const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { sendEmail } = require('../utils/email');

// Test email endpoint
router.post('/test-email', async (req, res) => {
    try {
        const testEmail = {
            to: req.body.email,
            subject: 'Test Email from AlertoAbra',
            html: `
                <h2>Test Email</h2>
                <p>This is a test email to verify the notification system.</p>
                <p>If you received this, the email system is working correctly.</p>
            `
        };

        console.log('Attempting to send test email to:', req.body.email);
        const result = await sendEmail(testEmail);
        console.log('Email send result:', result);

        res.json({
            success: true,
            message: 'Test email sent successfully',
            result
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
});

router.post('/news', notificationController.notifyNewPost);

module.exports = router;