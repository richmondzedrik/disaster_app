const mysql = require('mysql2/promise');
const config = require('../config/database');

async function up() {
    const connection = await mysql.createConnection({
        ...config,
        ssl: false // Disable SSL for initial database creation
    });
    try {
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

        // Create posts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                author_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                likes INT DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                image_url VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                CHECK (status IN ('pending', 'approved', 'rejected'))
            )
        `);

        // Create comments table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                deleted_by INT NULL,
                deletion_reason VARCHAR(255) NULL,
                deleted_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Create likes table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (post_id, user_id)
            )
        `);

        // Create alerts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                priority INT DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_public BOOLEAN DEFAULT false,
                created_by INT,
                is_archived BOOLEAN DEFAULT false,
                archived_at DATETIME DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expiry_date TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create alert_reads table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS alert_reads (
                user_id INT NOT NULL,
                alert_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, alert_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
            )
        `);

        // Create verification_attempts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS verification_attempts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                attempts INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Add post_likes table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS post_likes (
                id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                post_id int NOT NULL,
                user_id int NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY post_id (post_id),
                KEY user_id (user_id),
                CONSTRAINT post_likes_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
                CONSTRAINT post_likes_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.commit();
        console.log('All tables created successfully');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
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