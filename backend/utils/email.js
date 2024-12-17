const emailService = require('../services/emailService');
const config = require('../config/config');

exports.sendVerificationEmail = async (email, code) => {
    return emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email - Disaster Prep App',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">Verify Your Email</h1>
                    <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Your verification code is:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #42b983; letter-spacing: 5px;">${code}</span>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">This code will expire in 24 hours.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
                    </div>
                </div>
            </div>
        `
    });
};

exports.sendResetEmail = async (email, token) => {
    const resetUrl = `${config.frontend.url}/reset-password?token=${token}`;
    
    return emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request - Disaster Prep App',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <img src="${config.frontend.url}/logo.png" alt="Disaster Prep Logo" style="max-width: 150px; margin-bottom: 20px;">
                    <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">Password Reset Request</h1>
                    <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Click the button below to reset your password:</p>
                    
                    <a href="${resetUrl}" style="display: inline-block; background-color: #42b983; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0;">Reset Password</a>
                    
                    <p style="color: #dc3545; font-size: 14px; margin-top: 20px;">This link will expire in 1 hour.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email or contact support if you're concerned.</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                        <p style="color: #666; font-size: 12px; margin: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="color: #42b983; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">${resetUrl}</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} Disaster Prep App. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        `
    });
}; 