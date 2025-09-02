const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');
const { db } = require('../db/supabase-connection-cjs');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-code', authController.verifyCode);
router.post('/resend-code', authController.resendCode);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/validate-username', validation.validateUsernamePublic);
router.post('/validate-email', validation.validateEmailPublic);

// Protected routes
router.use(auth.authMiddleware);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

// Check username availability (public route)
router.get('/check-username/:username', authController.checkUsername);

// Add test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth service is operational'   
  });
});

// Add this route with your other auth routes
router.post('/verify-code', authController.verifyCode);

// Add this new route to check raw emergency contacts  
router.get('/debug/emergency-contacts', auth.authMiddleware, async (req, res) => {
    try {
        const userResult = await db.select('users', {
            where: { id: req.user.id },
            select: 'emergency_contacts'
        });
        
        if (userResult.error || !userResult.data || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data[0];

        return res.json({
            success: true,
            raw: user.emergency_contacts,
            parsed: Array.isArray(user.emergency_contacts) ? user.emergency_contacts : []
        });
    } catch (error) {
        console.error('Debug emergency contacts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching emergency contacts',
            error: error.message
        });
    }
});

// Add this new route to verify emergency contacts storage
router.get('/verify-emergency-contacts', auth.authMiddleware, async (req, res) => {
    try {
        // Get data from database using Supabase
        const userResult = await db.select('users', {
            where: { id: req.user.id || req.user.userId },
            select: 'emergency_contacts'
        });

        if (userResult.error || !userResult.data || userResult.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data[0];

        return res.json({
            success: true,
            raw_data: user.emergency_contacts,
            parsed_data: Array.isArray(user.emergency_contacts) ? user.emergency_contacts : [],
            is_valid_json: true // Supabase handles JSON automatically
        });
    } catch (error) {
        console.error('Emergency contacts verification error:', error);
        
        // Don't send 500 status for parsing errors
        if (error instanceof SyntaxError) {
            return res.json({
                success: true,
                raw_data: null,
                parsed_data: null,
                is_valid_json: false,
                error: 'Invalid JSON format'
            });   
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error verifying emergency contacts',
            error: error.message
        });
    }
});
  
// Add this new route
router.get('/emergency-contacts', auth.authMiddleware, async (req, res) => {
    try {
        // Check auth token
        if (!req.headers.authorization) {  
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Ensure user exists in request
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        console.log('Fetching emergency contacts for user:', req.user.id);

        // Get user data from Supabase
        const result = await db.supabase
            .from('users')
            .select('emergency_contacts')
            .eq('id', req.user.id)
            .single();

        if (result.error) {
            console.error('Database error:', result.error);
            if (result.error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw new Error(result.error.message);
        }

        let contacts = [];
        if (result.data && result.data.emergency_contacts) {
            contacts = Array.isArray(result.data.emergency_contacts)
                ? result.data.emergency_contacts
                : [];
        }

        console.log('Found emergency contacts:', contacts);

        return res.json({
            success: true,
            contacts: Array.isArray(contacts) ? contacts : []
        });
    } catch (error) {
        console.error('Get emergency contacts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching emergency contacts',
            error: error.message
        });
    }
});

// Add this route
router.post('/avatar', auth.authMiddleware, upload.single('avatar'), authController.updateAvatar);

// Add this route after line 31 (after the other protected routes)
router.delete('/delete-account', auth.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Delete user's data from related tables (Supabase will handle cascading deletes)
        // Note: With proper foreign key constraints, deleting the user should cascade

        try {
            // Delete related data first (optional, as CASCADE should handle this)
            await db.delete('comments', { user_id: userId });
            await db.delete('likes', { user_id: userId });
            await db.delete('posts', { author_id: userId });

            // Finally delete the user
            const deleteResult = await db.delete('users', userId);
            
            if (deleteResult.error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete account'
                });
            }

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });

        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
        
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
});

module.exports = router; 