const express = require('express');
const router = express.Router();
const { db } = require('../db/supabase-connection-cjs');
const auth = require('../middleware/auth');

router.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:5173', 'https://alertoabra.netlify.app'];
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
        const [markers] = await db.execute(`
            SELECT m.*, 
                   m.created_by as username,
                   u.username as created_by_username
            FROM map_markers m
            LEFT JOIN users u ON m.created_by = u.username
            ORDER BY m.created_at DESC
        `);
        
        // Format the response
        const formattedMarkers = markers.map(marker => ({
            ...marker,
            created_by: marker.created_by || 'Unknown User',
            created_by_username: marker.created_by || 'Unknown User'
        }));

        res.json({ success: true, markers: formattedMarkers });
    } catch (error) {
        console.error('Get markers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch markers' });
    }
});

// Add new marker
router.post('/', auth.authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { title, description, latitude, longitude } = req.body;
        const username = req.user.username;
        
        if (!title || !latitude || !longitude || !username) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Verify username exists
        const [userCheck] = await connection.execute(
            'SELECT username FROM users WHERE username = ?',
            [username]
        );

        if (!userCheck.length) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Start transaction
        await connection.beginTransaction();

        try {
            const [result] = await connection.execute(
                'INSERT INTO map_markers (title, description, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, description, latitude, longitude, req.user.username]
            );
            
            await connection.commit();
            
            res.json({
                success: true,
                marker: {
                    id: result.insertId,
                    title,
                    description,
                    latitude,
                    longitude,
                    created_by: username,
                    created_by_username: username,
                    created_at: new Date()
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating marker:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create marker',
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Delete marker (admin only)
router.delete('/:id', auth.authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

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
