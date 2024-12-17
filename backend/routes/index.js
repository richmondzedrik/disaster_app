const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const newsRoutes = require('./news');
const db = require('../db/connection');

// Database connection test
router.get('/db-test', async (req, res) => {
    try {
        await db.execute('SELECT 1');
        res.json({ 
            success: true, 
            message: 'Database connected successfully' 
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: error.message 
        });
    }
});

// Register all routes
router.use('/auth', authRoutes);
router.use('/news', newsRoutes);

// Test route
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;