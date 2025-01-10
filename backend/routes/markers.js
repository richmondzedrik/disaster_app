const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const auth = require('../middleware/auth');

router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://disasterapp.netlify.app');
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
    console.log('Received marker request:', req.body);
    try {
        const { title, description, latitude, longitude } = req.body;
        const [result] = await db.execute(
            'INSERT INTO map_markers (title, description, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?)',
            [title, description, latitude, longitude, req.user.id]
        );
        
        res.json({
            success: true,
            marker: {
                id: result.insertId,
                title,
                description,
                latitude,
                longitude,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('Add marker error:', error);
        res.status(500).json({ success: false, message: 'Failed to add marker' });
    }
});

// Delete marker
router.delete('/:id', auth.authMiddleware, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM map_markers WHERE id = ? AND created_by = ?',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Delete marker error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete marker' });
    }
});

module.exports = router;
