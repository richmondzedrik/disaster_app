const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!config.smtp.user || !config.smtp.pass) {
            throw new Error('SMTP credentials missing. Check your .env configuration.');
        }

        try {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: config.smtp.user,
                    pass: config.smtp.pass
                },
                debug: true
            });

            // Verify connection
            await this.transporter.verify();
            this.isInitialized = true;
            console.log('Email service initialized successfully');
            return true;
        } catch (error) {
            console.error('Email service initialization failed:', error);
            throw error;
        }
    }

    async sendEmail(options) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const mailOptions = {
                from: `"Disaster Prep App" <${config.smtp.user}>`,
                ...options
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', {
                messageId: info.messageId,
                recipient: options.to
            });
            return info;
        } catch (error) {
            console.error('Failed to send email:', {
                error: error.message,
                recipient: options.to,
                config: {
                    service: config.smtp.service,
                    host: config.smtp.host,
                    port: config.smtp.port,
                    user: config.smtp.user
                }
            });
            throw error;
        }
    }
}

module.exports = new EmailService(); 