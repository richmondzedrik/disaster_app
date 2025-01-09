const pool = require('../config/database');
const { validateToken } = require('../middleware/auth');

const notificationController = {
  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const [notifications] = await pool.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      );
      
      res.json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  },

  // Mark all notifications as read  
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await pool.execute(
        `UPDATE notifications 
         SET is_read = true 
         WHERE user_id = ?`,
        [userId]
      );
      
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
  },

  // Delete a notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await pool.execute(
        `DELETE FROM notifications 
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
  },

  // Clear all notifications
  async clearAll(req, res) {
    try {
      const userId = req.user.id;
      await pool.execute(
        'DELETE FROM notifications WHERE user_id = ?',
        [userId]
      );
      
      res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to clear notifications' });
    }
  }
};

module.exports = notificationController;
