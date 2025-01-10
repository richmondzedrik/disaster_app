const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// Protected routes (require authentication)
router.get('/profile', auth.authMiddleware, userController.getProfile);
router.put('/profile', auth.authMiddleware, userController.updateProfile);
router.delete('/profile', auth.authMiddleware, userController.deleteProfile);
router.post('/profile/verify-email/resend', auth.authMiddleware, userController.resendVerification);
router.put('/notifications', auth.authMiddleware, userController.updateNotificationPreferences);

// Add a route to check auth status
router.get('/check-auth', auth.authMiddleware, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.userId,
            role: req.user.role,
            email: req.user.email
        }
    });
});

module.exports = router; 