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
        console.log('Fetching markers from database...');

        // Get markers from Supabase (without join for now to avoid foreign key issues)
        const result = await db.supabase
            .from('map_markers')
            .select('*')
            .order('created_at', { ascending: false });

        if (result.error) {
            console.error('Database error:', result.error);
            throw new Error(result.error.message);
        }

        const markers = result.data || [];
        console.log(`Found ${markers.length} markers`);

        // Format the response
        const formattedMarkers = markers.map(marker => ({
            ...marker,
            created_by: marker.created_by || 'Unknown User',
            created_by_username: marker.created_by || 'Unknown User'
        }));

        res.json({
            success: true,
            markers: formattedMarkers,
            total: formattedMarkers.length
        });
    } catch (error) {
        console.error('Get markers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch markers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add new marker
router.post('/', auth.authMiddleware, async (req, res) => {
    try {
        console.log('Creating new marker:', req.body);
        console.log('User:', req.user);

        const { title, description, latitude, longitude } = req.body;
        const username = req.user.username;

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // Validate coordinates
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Create marker data
        const markerData = {
            title: title.trim(),
            description: description?.trim() || null,
            latitude: lat,
            longitude: lng,
            created_by: username,
            created_at: new Date().toISOString()
        };

        console.log('Inserting marker data:', markerData);

        // Insert into Supabase
        const result = await db.supabase
            .from('map_markers')
            .insert(markerData)
            .select()
            .single();

        if (result.error) {
            console.error('Database error:', result.error);
            throw new Error(result.error.message);
        }

        console.log('Marker created successfully:', result.data);

        res.json({
            success: true,
            message: 'Marker created successfully',
            marker: {
                ...result.data,
                created_by_username: username
            }
        });
    } catch (error) {
        console.error('Create marker error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create marker',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

        const markerId = req.params.id;

        if (!markerId) {
            return res.status(400).json({
                success: false,
                message: 'Marker ID is required'
            });
        }

        console.log(`Admin ${req.user.username} attempting to delete marker ${markerId}`);

        // Delete from Supabase
        const result = await db.supabase
            .from('map_markers')
            .delete()
            .eq('id', markerId)
            .select();

        if (result.error) {
            console.error('Database error:', result.error);
            throw new Error(result.error.message);
        }

        if (!result.data || result.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Marker not found'
            });
        }

        console.log(`Marker ${markerId} deleted successfully`);

        res.json({
            success: true,
            message: 'Marker deleted successfully'
        });
    } catch (error) {
        console.error('Delete marker error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete marker',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
