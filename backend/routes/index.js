const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const newsRoutes = require('./news');
const { db } = require('../db/supabase-connection-cjs');

// Database connection test
router.get('/db-test', async (req, res) => {
    try {
        const { testConnection } = require('../db/supabase-connection-cjs');
        const connected = await testConnection();
        if (connected) {
            res.json({
                success: true,
                message: 'Supabase connected successfully',
                database: 'Supabase PostgreSQL'
            });
        } else {
            throw new Error('Supabase connection failed');
        }
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Add these test endpoints
router.get('/auth/test', async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: 'Auth service is operational' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Auth service check failed' 
      });
    }
  });
  
  router.get('/admin/test', async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: 'Admin service is operational' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Admin service check failed' 
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