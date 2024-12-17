const express = require('express');
const router = express.Router();
const newsRoutes = require('./news');
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');

// Apply middleware to all admin routes
router.use(auth.authMiddleware);
router.use(adminMiddleware);

// Mount news routes
router.use('/news', newsRoutes);

// Debug logging
router.use((req, res, next) => {
    console.log('Admin route accessed:', req.method, req.path);
    next();
});

module.exports = router;