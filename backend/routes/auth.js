const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');
const db = require('../db/connection');
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
        const [rows] = await db.execute(
            'SELECT emergency_contacts FROM users WHERE id = ?',
            [req.user.id]
        );
        
        return res.json({
            success: true,
            raw: rows[0]?.emergency_contacts,
            parsed: rows[0]?.emergency_contacts ? 
                JSON.parse(rows[0].emergency_contacts) : 
                []
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
        // Get raw data from database
        const [rawResult] = await db.execute(
            'SELECT emergency_contacts FROM users WHERE id = ?',
            [req.user.id || req.user.userId]
        );

        // Get parsed data through User model
        const user = await User.findById(req.user.id || req.user.userId);

        return res.json({
            success: true,
            raw_data: rawResult[0]?.emergency_contacts,
            parsed_data: user?.emergencyContacts,
            is_valid_json: rawResult[0]?.emergency_contacts ? 
                JSON.parse(rawResult[0].emergency_contacts) : null
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

        // Get user data directly from database
        const [rows] = await db.execute(
            'SELECT emergency_contacts FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let contacts = [];
        if (rows[0].emergency_contacts) {
            contacts = typeof rows[0].emergency_contacts === 'string' 
                ? JSON.parse(rows[0].emergency_contacts)
                : rows[0].emergency_contacts;
        }

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
        
        // Get database connection
        const connection = await db.getConnection();
        
        try {
            // Start transaction
            await connection.beginTransaction();
            
            // Delete user's data from related tables
            await connection.query('DELETE FROM comments WHERE user_id = ?', [userId]);
            await connection.query('DELETE FROM likes WHERE user_id = ?', [userId]);
            await connection.query('DELETE FROM posts WHERE author_id = ?', [userId]);
            
            // Finally delete the user
            const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Commit the transaction
            await connection.commit();
            
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
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