const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const auth = require('../middleware/auth');

// Add CORS middleware
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

// Get all hazard zones
router.get('/', async (req, res) => {
    try {
        const [zones] = await db.execute(`
            SELECT * FROM hazard_zones 
            ORDER BY created_at DESC
        `);
        
        res.json({ 
            success: true, 
            zones: zones.map(zone => ({
                ...zone,
                coordinates: JSON.parse(zone.coordinates),
                risk_level: zone.risk_level
            }))
        });
    } catch (error) {
        console.error('Get hazard zones error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch hazard zones' 
        });
    }
});

// Add new hazard zone (admin only)
router.post('/', auth.authMiddleware, auth.adminMiddleware, async (req, res) => {
    try {
        const { name, description, risk_level, coordinates } = req.body;

        // Validate required fields
        if (!name || !risk_level || !coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Name, risk level, and coordinates are required'
            });
        }

        // Validate risk level
        if (!['low', 'moderate', 'high'].includes(risk_level)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid risk level. Must be low, moderate, or high'
            });
        }

        // Validate coordinates format
        if (!Array.isArray(coordinates)) {
            return res.status(400).json({
                success: false,
                message: 'Coordinates must be an array'
            });
        }
        
        const [result] = await db.execute(
            `INSERT INTO hazard_zones (name, description, risk_level, coordinates, created_by) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, description, risk_level, JSON.stringify(coordinates), req.user.id]
        );

        res.json({
            success: true,
            message: 'Hazard zone added successfully',
            zoneId: result.insertId
        });
    } catch (error) {
        console.error('Add hazard zone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add hazard zone'
        });
    }
});

module.exports = router; 