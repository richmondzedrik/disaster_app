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
router.get('/active', async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT 
                a.*,
                u.username as created_by_username
            FROM disaster_prep.alerts a
            LEFT JOIN disaster_prep.users u ON a.user_id = u.id
            WHERE a.is_active = true 
            AND (a.expiry_date IS NULL OR a.expiry_date > NOW())
            ORDER BY a.priority DESC, a.created_at DESC
        `);
        
        res.json({
            success: true,
            alerts: alerts.map(alert => ({
                ...alert,
                is_active: Boolean(alert.is_active),
                is_public: Boolean(alert.is_public)
            }))
        });
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts'
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

    const { message, type, priority, expiryDate, isPublic, sendEmail } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alert message is required'
      });
    }

    const alertData = {
      message: message.trim(),
      type: type || 'info',
      priority: priority === undefined ? 0 : parseInt(priority),
      expiry_date: expiryDate || null,
      is_public: isPublic === undefined ? false : Boolean(isPublic),
      user_id: req.user.userId,
      is_active: true
    };

    const [result] = await db.execute(
      `INSERT INTO alerts (message, type, priority, expiry_date, is_public, user_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [alertData.message, alertData.type, alertData.priority, alertData.expiry_date,
       alertData.is_public, alertData.user_id, alertData.is_active]
    );

    const [newAlert] = await db.execute(
      'SELECT * FROM alerts WHERE id = ?', 
      [result.insertId]
    );

    // Send email notifications if sendEmail is true
    let emailSent = false;
    if (sendEmail) {
      try {
        const verifiedEmails = await Alert.getVerifiedUserEmails();
        if (verifiedEmails.length > 0) {
          await Promise.all(verifiedEmails.map(email => 
            exports.sendAlertEmail(email, newAlert[0])
          ));
          emailSent = true;
        }
      } catch (emailError) {
        console.error('Error sending alert emails:', emailError);
        // Don't fail the request if emails fail
      }
    }

    res.json({
      success: true,
      message: 'Alert created successfully',
      alert: newAlert[0],
      emailSent
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert'
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
router.delete('/:id', auth.authMiddleware, async (req, res) => {
  try {
    // Check admin role directly
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    await db.execute('DELETE FROM alerts WHERE id = ?', [req.params.id]);
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

// Catch-all route for this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Alert route not found: ${req.method} ${req.originalUrl}`
  });
});

module.exports = router; 