const db = require('../db/connection');

class RefreshToken {
    static async create({ userId, token, expiresAt }) {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.execute(
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [userId, token, expiresAt]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    static async findByToken(token) {
        const connection = await db.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT rt.*, u.* 
                 FROM refresh_tokens rt 
                 JOIN users u ON rt.user_id = u.id 
                 WHERE rt.token = ? AND rt.expires_at > NOW()`,
                [token]
            );
            return rows[0];
        } finally {
            connection.release();
        }
    }

    static async deleteByUserId(userId) {
        const connection = await db.getConnection();
        try {
            await connection.execute(
                'DELETE FROM refresh_tokens WHERE user_id = ?',
                [userId]
            );
        } finally {
            connection.release();
        }
    }

    static async deleteExpired() {
        const connection = await db.getConnection();
        try {
            await connection.execute(
                'DELETE FROM refresh_tokens WHERE expires_at <= NOW()'
            );
        } finally {
            connection.release();
        }
    }
}

module.exports = RefreshToken; 