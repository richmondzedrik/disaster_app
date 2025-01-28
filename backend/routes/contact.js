const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

router.post('/send', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Send email using the emailService
        await emailService.sendEmail({
            to: 'richmondzedrik@gmail.com',
            from: email,
            subject: `Contact Form: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>New Contact Form Submission</h2>
                    <p><strong>From:</strong> ${name} (${email})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <div style="margin-top: 20px;">
                        <strong>Message:</strong>
                        <p style="white-space: pre-wrap;">${message}</p>
                    </div>
                </div>
            `
        });

        res.json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

module.exports = router;
