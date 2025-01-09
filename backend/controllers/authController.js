const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const crypto = require('crypto');
const { sendResetEmail, sendVerificationEmail } = require('../utils/email');
const RefreshToken = require('../models/RefreshToken');
const rateLimit = require('express-rate-limit');
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const express = require('express');
const app = express();

// Add this before defining routes
app.set('trust proxy', 1);

// Create a limiter for registration attempts - make it more lenient
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // increased from 5 to 10 attempts
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts. Please try again in 15 minutes.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000)
        });
    },
    trustProxy: true
});

// Add a store to track failed attempts
const failedAttempts = new Map();

exports.register = [registerLimiter, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { username, email, password } = req.body;
        
        await connection.beginTransaction();

        // Generate verification code first
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create user with verification code
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await connection.execute(
            `INSERT INTO users (username, email, password, role, verification_code, verification_code_expires) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, 'user', verificationCode, verificationCodeExpires]
        );

        const userId = result.insertId;

        // Verify the code was stored
        const [verifyResult] = await connection.execute(
            'SELECT verification_code FROM users WHERE id = ?',
            [userId]
        );

        if (!verifyResult[0] || !verifyResult[0].verification_code) {
            throw new Error('Failed to store verification code');
        }

        // Send verification email before committing transaction
        try {
            await sendVerificationEmail(email, verificationCode);
            await connection.commit();
            
            return res.status(201).json({ 
                success: true,
                message: 'Registration successful! Please check your email for the verification code.',
                userId
            });
        } catch (emailError) {
            await connection.rollback();
            console.error('Email sending error:', emailError);
            
            return res.status(500).json({
                success: false,
                message: 'Registration failed due to email sending error. Please try again.'
            });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Registration error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            if (error.message.includes('username')) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
            if (error.message.includes('email')) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        return res.status(500).json({ 
            success: false,
            message: 'Registration failed. Please try again.' 
        });
    } finally {
        connection.release();
    }
}];

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ 
                success: false,
                message: 'Verification token is required' 
            });
        }

        const result = await User.verifyEmail(token);
        
        if (!result.success) {
            return res.status(400).json({ 
                success: false,
                message: result.message 
            });
        }
        
        return res.json({ 
            success: true,
            message: result.message 
        });
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Verification failed. Please try again.' 
        });
    }
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
});

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Auto-verify admin accounts
        if (user.role === 'admin' && !user.email_verified) {
            await User.update(user.id, {
                email_verified: true,
                verification_code: null,
                verification_code_expires: null
            });
            user.email_verified = true;
        }

        // Check if JWT secrets are properly configured
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.error('JWT secrets not configured');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        // Generate access token
        const accessToken = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { 
                userId: user.id,
                role: user.role,
                tokenType: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            { 
                expiresIn: '7d'
            }
        );

        // Store the new refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await RefreshToken.create({
            userId: user.id,
            token: refreshToken,
            expiresAt
        });

        // Ensure email_verified status is included and properly typed
        const userData = {
            ...user,
            email_verified: Boolean(user.email_verified)
        };

        // Return success response with tokens and user data
        res.json({
            success: true,
            accessToken: `Bearer ${accessToken}`,
            refreshToken,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        const user = await RefreshToken.findByToken(refreshToken);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid refresh token' 
            });
        }

        // Generate new access token with all required fields
        const accessToken = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.json({ 
            success: true,
            accessToken: `Bearer ${accessToken}`
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

exports.logout = async (req, res) => {
    try {
        // Optionally invalidate the token if you're keeping track of them
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with that email address'
            });
        }

        // Generate reset token
        const resetToken = await User.setResetToken(email);

        // Send reset email
        await sendResetEmail(email, resetToken);

        res.json({
            success: true,
            message: 'Password reset instructions sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await User.resetPassword(token, newPassword);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || 'Password reset failed'
            });
        }
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
};

exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and verification code are required' 
            });
        }

        // First check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const result = await User.verifyCode(email, code);
        
        return res.json(result);

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Verification failed. Please try again.' 
        });
    }
};

exports.resendCode = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await User.updateVerificationCode(user.id, verificationCode);
        
        try {
            await sendVerificationEmail(email, verificationCode);
            return res.json({
                success: true,
                message: 'Verification code sent successfully'
            });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification code. Please try again.'
            });
        }
    } catch (error) {
        console.error('Resend code error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend verification code. Please try again.'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Format the response to match frontend expectations
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                email_verified: user.email_verified,
                created_at: user.created_at,
                is_admin: user.role === 'admin',
                phone: user.phone || '',
                location: user.location || '',
                notifications: user.notifications ? 
                    (typeof user.notifications === 'string' ? 
                        JSON.parse(user.notifications) : 
                        user.notifications) : 
                    { email: true, push: true },
                emergencyContacts: user.emergency_contacts ? 
                    (typeof user.emergency_contacts === 'string' ? 
                        JSON.parse(user.emergency_contacts) : 
                        user.emergency_contacts) : 
                    []
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, phone, location, notifications, emergencyContacts } = req.body;
        const userId = req.user.userId;

        // Validate data
        if (phone && !/^\+63[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        if (emergencyContacts?.length > 3) {
            return res.status(400).json({
                success: false,
                message: 'Maximum of 3 emergency contacts allowed'
            });
        }

        // Format the data before updating
        const profileData = {
            username,
            phone,
            location,
            notifications: typeof notifications === 'string' ? 
                JSON.parse(notifications) : notifications,
            emergencyContacts: typeof emergencyContacts === 'string' ? 
                JSON.parse(emergencyContacts) : emergencyContacts
        };

        // Update profile with validated data
        const updatedUser = await User.updateProfile(userId, profileData);

        // Return success response with updated user data
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...updatedUser,
                is_admin: updatedUser.role === 'admin'
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.message.includes('User not found')) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (error.message.includes('JSON')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
};

exports.changePassword = async (req, res) => {
    // ... existing code ...
};

exports.checkUsername = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findByUsername(username);
        
        res.json({
            success: true,
            available: !user,
            message: user ? 'Username is already taken' : 'Username is available'
        });
    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check username availability'
        });
    }
}; 