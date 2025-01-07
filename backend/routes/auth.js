const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');
const db = require('../db/connection');

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
router.get('/debug/emergency-contacts', auth.authenticateToken, async (req, res) => {
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

module.exports = router; 