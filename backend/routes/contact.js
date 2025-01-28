const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const config = require('../config/config');

// Configure nodemailer with Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
    },
    debug: true // Enable debug logs
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Configuration Error:', error);
    } else {
        console.log('SMTP Server is ready to send emails');
    }
});

router.post('/send', async (req, res) => {
    try {
        const { name, email, subject, message, adminEmail } = req.body;

        // Email to admin
        const adminMailOptions = {
            from: config.smtp.from || config.smtp.user,
            to: adminEmail,
            subject: `New Contact Form Message: ${subject}`,
            html: `
                <h2>New Contact Form Message</h2>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        // Auto-reply to user
        const userMailOptions = {
            from: config.smtp.from || config.smtp.user,
            to: email,
            subject: 'Thank you for contacting AlertoAbra',
            html: `
                <h2>Thank you for contacting AlertoAbra</h2>
                <p>Dear ${name},</p>
                <p>We have received your message and will get back to you as soon as possible.</p>
                <p>Your message details:</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <br>
                <p>Best regards,</p>
                <p>AlertoAbra Team</p>
            `
        };

        // Send emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message. Please try again later.' 
        });
    }
});

module.exports = router;
