const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!config.smtp.user || !config.smtp.pass) {
            console.error('SMTP Configuration:', {
                user: !!config.smtp.user,
                pass: !!config.smtp.pass,
                host: config.smtp.host,
                port: config.smtp.port
            });
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
                debug: true,
                logger: true // Enable built-in logger
            });

            // Verify connection with detailed logging
            console.log('Attempting to verify SMTP connection...');
            await this.transporter.verify();
            this.isInitialized = true;
            console.log('Email service initialized successfully with:', {
                host: 'smtp.gmail.com',
                port: 587,
                user: config.smtp.user
            });
            return true;
        } catch (error) {
            console.error('Email service initialization failed:', {
                error: error.message,
                stack: error.stack,
                code: error.code,
                command: error.command
            });
            throw error;
        }
    }

    async sendEmail(options) {
        if (!this.isInitialized) {
            console.log('Email service not initialized, attempting initialization...');
            await this.initialize();
        }

        try {
            console.log('Preparing to send email:', {
                to: options.to,
                subject: options.subject
            });

            const mailOptions = {
                from: `"Disaster Prep App" <${config.smtp.user}>`,
                ...options
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', {
                messageId: info.messageId,
                recipient: options.to,
                response: info.response
            });
            return info;
        } catch (error) {
            console.error('Failed to send email:', {
                error: error.message,
                code: error.code,
                command: error.command,
                recipient: options.to,
                config: {
                    service: 'gmail',
                    host: 'smtp.gmail.com',
                    port: 587,
                    user: config.smtp.user
                }
            });
            throw error;
        }
    }
}

module.exports = new EmailService();