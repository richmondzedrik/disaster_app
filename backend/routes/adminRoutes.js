const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Protect all admin routes with isAdmin middleware
router.use(isAdmin);

// User management routes
router.delete('/users/:id', adminController.deleteUser);

module.exports = router; 