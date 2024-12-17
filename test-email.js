const emailService = require('./services/emailService');
emailService.sendEmail({
    to: 'richmondzedrik@gmail.com',
    subject: 'Test Email',
    html: '<h1>Test Email</h1><p>This is a test email.</p>'
}).then(console.log).catch(console.error);
