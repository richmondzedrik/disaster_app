const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/connection');
const Alert = require('../models/Alert');
const { sendAlertEmail } = require('../utils/email');
 
// Base route test
router.get('/test', (req, res) => {
  res.json({ message: 'Alerts route working' });
});

// Get active alerts
router.get('/active', auth.authMiddleware, async (req, res) => {
    try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://disasterapp.netlify.app');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        const [rows] = await db.execute(`
            SELECT a.*, u.username as created_by_username 
            FROM alerts a
            LEFT JOIN users u ON a.created_by = u.id
            WHERE a.is_active = true 
            AND (a.expiry_date IS NULL OR a.expiry_date > NOW())
            ORDER BY a.priority DESC, a.created_at DESC
        `);
        
        res.json({
            success: true,
            alerts: rows.map(alert => ({
                ...alert,
                is_active: Boolean(alert.is_active),
                is_public: Boolean(alert.is_public)
            }))
        });
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active alerts'
        });
    }
});

// Get alert count
router.get('/count', auth.authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM alerts 
            WHERE is_active = true
        `);
        
        res.json({
            success: true,
            count: rows[0].count
        });
    } catch (error) {
        console.error('Error fetching alert count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alert count'
        });
    }
});

// Remove duplicate route
router.get('/api/alerts/active', (req, res) => {
    res.redirect('/api/alerts/active');
});

// Get all alerts (admin only)
router.get('/admin', auth.authMiddleware, async (req, res) => {
  try {
    // Add admin check here instead of using separate middleware
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [rows] = await db.execute(`
      SELECT * FROM alerts 
      ORDER BY created_at DESC
    `);
    res.json({ 
      success: true, 
      alerts: rows 
    });
  } catch (error) {
    console.error('Get admin alerts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts' 
    });
  }
});

// Create new alert (admin only)
router.post('/', auth.authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { message, type, priority, expiry_date, is_public } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alert message is required'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO alerts (message, type, priority, expiry_date, is_public, user_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, true)`,
      [message.trim(), type || 'info', priority || 0, expiry_date || null, 
       is_public || false, req.user.userId]
    );

    const [newAlert] = await db.execute(
      'SELECT * FROM alerts WHERE id = ?', 
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      alert: newAlert[0]
    });
  } catch (error) {
    console.error('Create alert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error occurred while creating alert'
    });
  }
});

// Deactivate alert (admin only)
router.post('/deactivate/:id', auth.authMiddleware, async (req, res) => {
  try {
    // Check admin role directly
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    await db.execute(
      'UPDATE alerts SET is_active = false WHERE id = ?',
      [req.params.id]
    );
    res.json({ 
      success: true, 
      message: 'Alert deactivated successfully' 
    });
  } catch (error) {
    console.error('Deactivate alert error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate alert' 
    });
  }
});

// Reactivate alert (admin only)
router.post('/reactivate/:id', auth.authMiddleware, async (req, res) => {
  try {
    // Check admin role directly
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    await db.execute(
      'UPDATE alerts SET is_active = true WHERE id = ?',
      [req.params.id]
    );
    res.json({ 
      success: true, 
      message: 'Alert reactivated successfully'  
    });
  } catch (error) {
    console.error('Reactivate alert error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reactivate alert' 
    });
  }
}); 

// Delete alert (admin only)
// Delete alert (admin only)
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [result] = await db.query('DELETE FROM alerts WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({ 
      success: true, 
      message: 'Alert deleted successfully' 
    });
  } catch (error) {
    console.error('Delete alert error:', error); 
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete alert' 
    });
  }
});
// Get all alerts
router.get('/', auth.authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM alerts 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, alerts: rows });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts' 
    });
  }
});

// Get single alert
router.get('/:id', auth.authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM alerts 
      WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.json({ success: true, alert: rows[0] });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert'
    });
  }
});

// Mark alert as read
router.post('/:id/read', auth.authMiddleware, async (req, res) => {
  try {
    const alertId = req.params.id;
    const userId = req.user.userId;

    // Check if already read
    const [existing] = await db.execute(
      'SELECT * FROM alert_reads WHERE alert_id = ? AND user_id = ?',
      [alertId, userId]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Alert already marked as read'
      });
    }

    // Mark as read
    await db.execute(
      'INSERT INTO alert_reads (alert_id, user_id) VALUES (?, ?)',
      [alertId, userId]
    );

    res.json({
      success: true,
      message: 'Alert marked as read'
    });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read'
    });
  }
});

// Catch-all route for this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Alert route not found: ${req.method} ${req.originalUrl}`
  });
});

module.exports = router; 