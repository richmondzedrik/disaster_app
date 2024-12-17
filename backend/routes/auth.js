const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

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

module.exports = router; 