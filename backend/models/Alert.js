const db = require('../db/connection');

class Alert {
    static async create({ message, type, priority, expiry_date, is_public, created_by }) {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO alerts (message, type, priority, expiry_date, is_public, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [message, type, priority, expiry_date, is_public, created_by]
            );
            return { id: result.insertId, message, type, priority, expiry_date, is_public, created_by };
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    }

    static async getAll() {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT a.*, u.username as created_by_username 
                 FROM alerts a 
                 LEFT JOIN users u ON a.user_id = u.id 
                 ORDER BY a.created_at DESC`
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    static async getActive(userId) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT a.*, u.username as created_by_username 
                 FROM alerts a 
                 LEFT JOIN users u ON a.user_id = u.id 
                 WHERE (a.is_public = true OR a.user_id = ?) 
                 AND a.expiry_date > NOW() 
                 AND a.is_active = true 
                 ORDER BY a.priority DESC, a.created_at DESC`,
                [userId]
            );
            return rows;
        } finally {
            connection.release();
        }
    }

    static async getAllForAdmin() {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT a.*, u.username as created_by_username 
                 FROM alerts a 
                 LEFT JOIN users u ON a.user_id = u.id 
                 ORDER BY a.is_active DESC, a.priority DESC, a.created_at DESC`
            );
            return rows;
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    }

    static async deactivate(id) {
        const connection = await db.getConnection();
        try {
            await connection.execute(
                'UPDATE alerts SET is_active = false WHERE id = ?',
                [id]
            );
        } finally {
            connection.release();
        }
    }

    static async reactivate(id) {
        const connection = await db.getConnection();
        try {
            await connection.execute(
                'UPDATE alerts SET is_active = true WHERE id = ?',
                [id]
            );
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.execute('DELETE FROM alerts WHERE id = ?', [id]);
        } finally {
            connection.release();
        }
    }

    static async getVerifiedUserEmails() {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT email FROM users WHERE email_verified = true'
            );
            return rows.map(row => row.email);
        } finally {
            connection.release();
        }
    }
}

module.exports = Alert;