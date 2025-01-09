const db = require('../db/connection');

class Notification {
    static async getForUser(userId) {
        const [notifications] = await db.execute(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        return notifications;
    }

    static async create(data) {
        const { user_id, type, message, reference_id = null } = data;
        const [result] = await db.execute(
            `INSERT INTO notifications (user_id, type, message, reference_id) 
             VALUES (?, ?, ?, ?)`,
            [user_id, type, message, reference_id]
        );
        return result.insertId;
    }

    static async markAsRead(id, userId) {
        const [result] = await db.execute(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getUnreadCount(userId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
            [userId]
        );
        return rows[0].count;
    }
}

module.exports = Notification;
