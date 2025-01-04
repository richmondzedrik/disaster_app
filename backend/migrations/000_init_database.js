const mysql = require('mysql2/promise');
const config = require('../config/database');

async function up() {
    let connection;
    try {
        connection = await mysql.createConnection({
            ...config,
            ssl: false, // Disable SSL for initial database creation
            connectionLimit: 1
        });
        
        await connection.beginTransaction();

        // Create users table first as it's referenced by other tables
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                email_verified BOOLEAN DEFAULT false,
                verification_code VARCHAR(6),
                verification_code_expires DATETIME,
                reset_token VARCHAR(255) NULL,
                reset_token_expires TIMESTAMP NULL,
                phone VARCHAR(20),
                notifications JSON,
                location VARCHAR(255) NULL,
                emergency_contacts JSON NULL DEFAULT ('[]'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        await connection.commit();
        return true;
    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

async function down() {
    const connection = await mysql.createConnection(config);
    try {
        await connection.beginTransaction();

        // Drop tables in reverse order of creation (due to foreign key constraints)
        await connection.execute('DROP TABLE IF EXISTS verification_attempts');
        await connection.execute('DROP TABLE IF EXISTS alert_reads');
        await connection.execute('DROP TABLE IF EXISTS alerts');
        await connection.execute('DROP TABLE IF EXISTS likes');
        await connection.execute('DROP TABLE IF EXISTS comments');
        await connection.execute('DROP TABLE IF EXISTS posts');
        await connection.execute('DROP TABLE IF EXISTS users');

        await connection.commit();
        console.log('All tables dropped successfully');
    } catch (error) {
        await connection.rollback();
        console.error('Migration rollback failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

module.exports = { up, down };