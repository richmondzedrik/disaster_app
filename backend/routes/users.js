const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// These routes will be prefixed with /api/users
router.get('/profile', auth.authMiddleware, userController.getProfile);
router.put('/profile', auth.authMiddleware, userController.updateProfile);
router.delete('/profile', auth.authMiddleware, userController.deleteProfile);

module.exports = router; 