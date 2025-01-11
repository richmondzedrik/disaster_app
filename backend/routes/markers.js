const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const auth = require('../middleware/auth');

router.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:5173', 'https://disasterapp.netlify.app'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
    
// Get all markers
router.get('/', async (req, res) => {
    try {
        const [markers] = await db.execute(
            'SELECT * FROM map_markers ORDER BY created_at DESC'
        );
        res.json({ success: true, markers });
    } catch (error) {
        console.error('Get markers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch markers' });
    }
});

// Add new marker
router.post('/', auth.authMiddleware, async (req, res) => {
    console.log('Received marker request:', {
        body: req.body,
        user: req.user,
        headers: req.headers
    });
    
    try {
        const { title, description, latitude, longitude } = req.body;
        
        if (!title || !latitude || !longitude) {
            console.warn('Missing required fields:', { title, latitude, longitude });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        console.log('Executing database query with params:', {
            title,
            description,
            latitude,
            longitude,
            userId: req.user.id
        });

        const [result] = await db.execute(
            'INSERT INTO map_markers (title, description, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?)',
            [title, description, latitude, longitude, req.user.id]
        );
        
        console.log('Marker created successfully:', {
            result,
            insertId: result.insertId
        });
        
        res.json({
            success: true,
            marker: {
                id: result.insertId,
                title,
                description,
                latitude,
                longitude,
                created_by: req.user.id,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('Add marker error:', {
            error: error.message,
            stack: error.stack,
            sql: error.sql
        });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add marker',
            error: error.message 
        });
    }
});

// Delete marker (admin only)
router.delete('/:id', auth.authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Remove the created_by check since admin can delete any marker
        await db.execute(
            'DELETE FROM map_markers WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Delete marker error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete marker' 
        });
    }
});

module.exports = router;
