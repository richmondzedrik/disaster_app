const Alert = require('../models/Alert');
const db = require('../db/connection');

exports.createAlert = async (req, res) => {
    try {
        const { message, type, priority, expiryDate, isPublic } = req.body;
        
        // Validate required fields
        if (!message || !type) {
            return res.status(400).json({
                success: false,
                message: 'Message and type are required'
            });
        }

        // Create alert with properly named expiry_date field
        const alert = await Alert.create({
            message,
            type,
            priority: priority || 0,
            expiry_date: expiryDate,  // This matches the database column name
            is_public: isPublic,
            created_by: req.user.userId
        });

        return res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            alert
        });
    } catch (error) {
        console.error('Create alert error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create alert'
        });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.getAll();
        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
};

exports.getActiveAlerts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const alerts = await Alert.getActive(userId);
        
        res.json({
            success: true,
            alerts
        });
    } catch (error) {
        console.error('Get active alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts'
        });
    }
};

exports.deactivateAlert = async (req, res) => {
    try {
        await Alert.deactivate(req.params.id);
        res.json({ success: true, message: 'Alert deactivated successfully' });
    } catch (error) {
        console.error('Deactivate alert error:', error);
        res.status(500).json({ success: false, message: 'Failed to deactivate alert' });
    }
};

exports.getAdminAlerts = async (req, res) => {
    try {
        const alerts = await Alert.getAllForAdmin();
        res.json({ 
            success: true, 
            alerts 
        });
    } catch (error) {
        console.error('Get admin alerts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch admin alerts' 
        });
    }
};

exports.archiveAlert = async (req, res) => {
    try {
        await Alert.archive(req.params.id);
        res.json({ 
            success: true, 
            message: 'Alert archived successfully' 
        });
    } catch (error) {
        console.error('Archive alert error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to archive alert' 
        });
    }
};

exports.getArchivedAlerts = async (req, res) => {
    try {
        const alerts = await Alert.getArchivedAlerts();
        res.json({ 
            success: true, 
            alerts 
        });
    } catch (error) {
        console.error('Get archived alerts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch archived alerts' 
        });
    }
};

exports.reactivateAlert = async (req, res) => {
    try {
        await Alert.reactivate(req.params.id);
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
};

exports.deleteAlert = async (req, res) => {
    try {
        const success = await Alert.delete(req.params.id);
        if (!success) {
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
};

exports.markAlertAsRead = async (req, res) => {
    try {
        const alertId = req.params.id;
        const userId = req.user.userId;

        // Insert into alert_reads table
        await db.query(
            `INSERT INTO alert_reads (user_id, alert_id, read_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP) 
             ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
            [userId, alertId]
        );

        // Get the updated alert with read status
        const [alerts] = await db.query(
            `SELECT a.*, 
                    CASE WHEN ar.read_at IS NOT NULL THEN TRUE ELSE FALSE END as is_read
             FROM alerts a
             LEFT JOIN alert_reads ar ON a.id = ar.alert_id AND ar.user_id = ?
             WHERE a.id = ?`,
            [userId, alertId]
        );

        if (alerts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Alert marked as read',
            alert: {
                ...alerts[0],
                is_read: Boolean(alerts[0].is_read)
            }
        });
    } catch (error) {
        console.error('Mark alert as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark alert as read'
        });
    }
}; 