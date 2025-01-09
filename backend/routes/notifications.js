const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/user', authenticateToken, notificationController.getUserNotifications);
router.put('/mark-all-read', authenticateToken, notificationController.markAllAsRead);
router.delete('/:id', authenticateToken, notificationController.deleteNotification);
router.delete('/clear', authenticateToken, notificationController.clearAll);
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

module.exports = router;
  