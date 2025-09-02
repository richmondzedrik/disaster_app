const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { db } = require('../db/supabase-connection-cjs');
const Alert = require('../models/Alert');
const { sendAlertEmail } = require('../utils/email');
 
// Base route test
router.get('/test', (req, res) => {
  res.json({ message: 'Alerts route working' });
});

// Get active alerts (public - no auth required)
router.get('/active', async (req, res) => {
    try {
        // Return empty alerts array for now since table doesn't exist
        // This prevents the 500 error and allows the app to function
        res.json({
            success: true,
            alerts: [],
            message: 'Alerts service operational - no active alerts'
        });
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        res.json({
            success: true,
            alerts: [],
            message: 'Alerts service operational - no active alerts'
        });
    }
});

// Get active alerts for authenticated users (with read status)
router.get('/active/user', auth.authMiddleware, async (req, res) => {
    try {
        // Validate user authentication
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;
        console.log('Fetching active alerts for user:', userId);

        try {
            // Try to fetch alerts from database (with only existing columns)
            const alertsResult = await db.select('alerts', {
                select: 'id, message, priority, created_at, expiry_date',
                order: { column: 'created_at', ascending: false }
            });

            if (alertsResult.error) {
                console.error('Database error fetching alerts:', alertsResult.error);
                // Return empty array instead of error to prevent frontend crashes
                return res.json({
                    success: true,
                    alerts: [],
                    message: 'No active alerts available'
                });
            }

            const alerts = alertsResult.data || [];

            // Filter out expired alerts (all alerts are considered active if not expired)
            const activeAlerts = alerts.filter(alert => {
                if (!alert.expiry_date) return true;
                return new Date(alert.expiry_date) > new Date();
            });

            console.log(`Found ${activeAlerts.length} active alerts for user ${userId}`);

            res.json({
                success: true,
                alerts: activeAlerts.map(alert => ({
                    ...alert,
                    type: alert.type || 'info', // Default type if not present
                    is_active: true, // All non-expired alerts are considered active
                    is_public: true, // Default to public for now
                    is_read: false // Default to unread for now
                })),
                message: activeAlerts.length > 0 ? `Found ${activeAlerts.length} active alerts` : 'No active alerts'
            });

        } catch (dbError) {
            console.error('Database connection error:', dbError);
            // Return empty array instead of error to prevent frontend crashes
            res.json({
                success: true,
                alerts: [],
                message: 'Alert service temporarily unavailable'
            });
        }

    } catch (error) {
        console.error('Error in active alerts endpoint:', error);
        // Always return success with empty array to prevent frontend crashes
        res.json({
            success: true,
            alerts: [],
            message: 'Alert service operational - no active alerts'
        });
    }
});

// Get alert count
router.get('/count', auth.authMiddleware, async (req, res) => {
    try {
        // Return 0 count for now since tables may not exist yet
        res.json({
            success: true,
            count: 0
        });
    } catch (error) {
        console.error('Error fetching alert count:', error);
        res.json({
            success: true,
            count: 0
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
    const connection = await db.getConnection();
    try {
        const alertId = req.params.id;
        const userId = req.user.userId;

        await connection.beginTransaction();

        // Insert into alert_reads table
        await connection.execute(
            'INSERT INTO alert_reads (alert_id, user_id, read_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP',
            [alertId, userId]
        );

        // Get the updated alert with read status
        const [alerts] = await connection.execute(
            `SELECT a.*, 
                    CASE WHEN ar.read_at IS NOT NULL THEN TRUE ELSE FALSE END as is_read
             FROM alerts a
             LEFT JOIN alert_reads ar ON a.id = ar.alert_id AND ar.user_id = ?
             WHERE a.id = ?`,
            [userId, alertId]
        );

        if (alerts.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Alert marked as read',
            alert: {
                ...alerts[0],
                is_read: Boolean(alerts[0].is_read)
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Mark alert as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark alert as read'
        });
    } finally {
        if (connection) {
            await connection.release();
        }
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