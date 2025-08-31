const User = require('../models/User');
const { db } = require('../db/supabase-connection-cjs');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('../utils/email');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove sensitive data
        const { password, ...userData } = user;
        
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile data'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, phone, location, notifications, emergencyContacts } = req.body;
        const userId = req.user.userId;

        console.log('Updating profile for user:', userId, req.body);

        // Validate data before database operation
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

        // Update profile with validated data
        const updatedUser = await User.updateProfile(userId, {
            username,
            phone,
            location,
            notifications,
            emergencyContacts
        });

        console.log('Profile updated:', updatedUser);

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
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        await User.delete(userId);
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await User.updateVerificationCode(userId, verificationCode);
        await sendVerificationEmail(user.email, verificationCode);

        res.json({
            success: true,
            message: 'Verification code resent successfully'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification code'
        });
    }
};

exports.updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notifications } = req.body;
        
        await db.execute(
            'UPDATE users SET notifications = ? WHERE id = ?',
            [notifications, userId]
        );
        
        res.json({
            success: true,
            message: 'Notification preferences updated successfully'
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences'
        });
    }
}; 