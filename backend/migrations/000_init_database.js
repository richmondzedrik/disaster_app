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

        // Add checklist_progress table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS checklist_progress (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                item_id VARCHAR(50) NOT NULL,
                completed BOOLEAN DEFAULT false, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_item (user_id, item_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Add checklist_items table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS checklist_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                item_id VARCHAR(50) NOT NULL,
                text TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                info TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_item_id (user_id, item_id)
            )
        `);

        
        // Add alerts table creation
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                message TEXT NOT NULL,
                type ENUM('info', 'warning', 'danger') DEFAULT 'info',
                priority INT DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_public BOOLEAN DEFAULT false,
                created_by INT,
                expiry_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
        await connection.execute('DROP TABLE IF EXISTS checklist_progress');
        await connection.execute('DROP TABLE IF EXISTS verification_attempts');
        await connection.execute('DROP TABLE IF EXISTS alert_reads');
        await connection.execute('DROP TABLE IF EXISTS alerts');
        await connection.execute('DROP TABLE IF EXISTS likes');
        await connection.execute('DROP TABLE IF EXISTS comments');
        await connection.execute('DROP TABLE IF EXISTS posts');
        await connection.execute('DROP TABLE IF EXISTS users');
        await connection.execute('DROP TABLE IF EXISTS checklist_items');

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