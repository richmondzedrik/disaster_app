const jwt = require('jsonwebtoken');
const config = require('../config/config');
const crypto = require('crypto');
const { sendResetEmail, sendVerificationEmail } = require('../utils/email');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const express = require('express');
const app = express();
const cloudinary = require('../config/cloudinary');

// Import Supabase connection
const { db } = require('../db/supabase-connection');

// Add this before defining routes
app.set('trust proxy', 1);

// Create a limiter for registration attempts
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts. Please try again in 15 minutes.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000)
        });
    },
    trustProxy: true
});

// Store to track failed attempts
const failedAttempts = new Map();

exports.register = [registerLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Check if user already exists
        const existingUser = await db.select('users', {
            where: { email: email }
        });

        if (existingUser.data && existingUser.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check username availability
        const existingUsername = await db.select('users', {
            where: { username: username }
        });

        if (existingUsername.data && existingUsername.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = await db.insert('users', {
            username,
            email,
            password: hashedPassword,
            verification_code: verificationCode,
            verification_code_expires: verificationCodeExpires.toISOString(),
            email_verified: false,
            role: 'user',
            notifications: true,
            emergency_contacts: []
        });

        if (newUser.error) {
            throw new Error(newUser.error.message);
        }

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification code.',
            userId: newUser.data[0].id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
}];

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const userResult = await db.select('users', {
            where: { email: email }
        });

        if (userResult.error || !userResult.data || userResult.data.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = userResult.data[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in',
                needsVerification: true
            });
        }

        // Update last login
        await db.update('users', user.id, {
            last_login: new Date().toISOString()
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user.id },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                notifications: user.notifications,
                location: user.location,
                phone: user.phone,
                emergency_contacts: user.emergency_contacts
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find user by email
        const userResult = await db.select('users', {
            where: { email: email }
        });

        if (userResult.error || !userResult.data || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data[0];

        // Check if code matches and hasn't expired
        if (user.verification_code !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        if (new Date() > new Date(user.verification_code_expires)) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired'
            });
        }

        // Update user as verified
        const updateResult = await db.update('users', user.id, {
            email_verified: true,
            verification_code: null,
            verification_code_expires: null
        });

        if (updateResult.error) {
            throw new Error(updateResult.error.message);
        }

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const userResult = await db.select('users', {
            where: { id: userId },
            select: 'id, username, email, role, avatar_url, notifications, location, phone, emergency_contacts, created_at'
        });

        if (userResult.error || !userResult.data || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data[0];

        res.json({
            success: true,
            user: user
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
        const userId = req.user.userId;
        const { username, phone, location, notifications, emergency_contacts } = req.body;

        // Check if username is taken by another user
        if (username) {
            const existingUser = await db.select('users', {
                where: { username: username }
            });

            if (existingUser.data && existingUser.data.length > 0 && existingUser.data[0].id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
        }

        // Update user profile
        const updateData = {};
        if (username) updateData.username = username;
        if (phone !== undefined) updateData.phone = phone;
        if (location !== undefined) updateData.location = location;
        if (notifications !== undefined) updateData.notifications = notifications;
        if (emergency_contacts !== undefined) updateData.emergency_contacts = emergency_contacts;
        updateData.updated_at = new Date().toISOString();

        const updateResult = await db.update('users', userId, updateData);

        if (updateResult.error) {
            throw new Error(updateResult.error.message);
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        // Get current user
        const userResult = await db.select('users', {
            where: { id: userId }
        });

        if (userResult.error || !userResult.data || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data[0];

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        const updateResult = await db.update('users', userId, {
            password: hashedNewPassword,
            updated_at: new Date().toISOString()
        });

        if (updateResult.error) {
            throw new Error(updateResult.error.message);
        }

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // But we can blacklist the token or update last_logout time

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

exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.params;

        const userResult = await db.select('users', {
            where: { username: username }
        });

        const isAvailable = !userResult.data || userResult.data.length === 0;

        res.json({
            success: true,
            available: isAvailable
        });

    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check username availability'
        });
    }
};
