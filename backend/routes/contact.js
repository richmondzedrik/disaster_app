const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: process.env.EMAIL_USER || 'pdrrmc.abra@yahoo.com.ph',
        pass: process.env.EMAIL_PASSWORD // Set this in your environment variables
    }
});

router.post('/send', async (req, res) => {
    try {
        const { name, email, subject, message, adminEmail } = req.body;

        // Email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER || 'pdrrmc.abra@yahoo.com.ph',
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
            from: process.env.EMAIL_USER || 'pdrrmc.abra@yahoo.com.ph',
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
