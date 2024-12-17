const emailService = require('./services/emailService');
const config = require('./config/config');

async function testEmail() {
    try {
        console.log('Testing email service with config:', {
            user: config.smtp.user,
            from: config.smtp.from
        });

        await emailService.sendEmail({
            to: config.smtp.user, // Send to yourself for testing
            subject: 'Test Email from Disaster Prep App',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1>Test Email</h1>
                    <p>This is a test email to verify the email service is working correctly.</p>
                    <p>Sent at: ${new Date().toISOString()}</p>
                </div>
            `
        });

        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Failed to send test email:', error);
    }
}

testEmail(); 