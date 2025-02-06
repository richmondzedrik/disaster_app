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
                notifications BOOLEAN DEFAULT true,
                location VARCHAR(255) NULL,
                emergency_contacts JSON NULL DEFAULT ('[]'),
                avatar_url VARCHAR(255) NULL,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
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

        // Default checklist items
        await connection.execute(`
            INSERT IGNORE INTO checklist_items (user_id, item_id, text, category, info) VALUES
            (1, 'emergency-kit-1', 'Create an emergency kit with essential supplies', 'Emergency Kit', 'Include water, non-perishable food, flashlights, batteries, first aid supplies, and medications'),
            (1, 'emergency-kit-2', 'Store at least 3 days worth of water (1 gallon per person per day)', 'Emergency Kit', 'Consider additional water for pets and cleaning'),
            (1, 'emergency-kit-3', 'Pack a portable emergency kit for your car', 'Emergency Kit', 'Include jumper cables, flashlights, basic tools, first aid kit, and blankets'),
            
            (1, 'documents-1', 'Gather and secure important documents', 'Documents', 'Include identification, insurance policies, bank records, and emergency contacts list'),
            (1, 'documents-2', 'Create digital copies of important documents', 'Documents', 'Store in a secure cloud service or encrypted drive'),
            
            (1, 'communication-1', 'Establish an emergency communication plan', 'Communication', 'Designate an out-of-area contact as a central point of communication'),
            (1, 'communication-2', 'Program emergency contacts in all family phones', 'Communication', 'Include local emergency services, family members, and designated out-of-area contact'),
            
            (1, 'evacuation-1', 'Create an evacuation plan and share with family', 'Evacuation', 'Include multiple routes and designated meeting points'),
            (1, 'evacuation-2', 'Practice evacuation drills with family members', 'Evacuation', 'Conduct drills at least twice a year and update plans as needed'),
            
            (1, 'home-1', 'Install smoke detectors and carbon monoxide alarms', 'Home Safety', 'Test monthly and replace batteries annually'),
            (1, 'home-2', 'Know how to shut off utilities', 'Home Safety', 'Learn locations and proper procedures for water, gas, and electricity'),
            
            (1, 'medical-1', 'Create a first aid kit', 'Medical', 'Include bandages, antiseptic wipes, scissors, tweezers, and basic medications'),
            (1, 'medical-2', 'List of current medications and medical conditions', 'Medical', 'Keep both physical and digital copies, update regularly')
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
                is_read BOOLEAN DEFAULT false,
                expiry_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Add notifications table after the alerts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                type ENUM('like', 'post', 'alert', 'post_created') NOT NULL,
                reference_id VARCHAR(255),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Add map_markers table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS map_markers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE SET NULL
            )
        `);

        // Add hazard_zones table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS hazard_zones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                risk_level ENUM('low', 'moderate', 'high') NOT NULL,
                coordinates JSON NOT NULL,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Add posts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                author_id INT NOT NULL,
                author_avatar VARCHAR(255) NULL,
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

        // Add likes table
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

        // Add first_aid_guides table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS first_aid_guides (
                id INT PRIMARY KEY AUTO_INCREMENT,
                guide_index INT NOT NULL UNIQUE,
                video_url TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default first aid guides
        await connection.execute(`
            INSERT IGNORE INTO first_aid_guides (guide_index, video_url) VALUES
            (0, 'https://www.youtube.com/watch?v=hizBdM1Ob68'),
            (1, 'https://www.youtube.com/watch?v=gOWEFgsrNhI'),
            (2, 'https://www.youtube.com/watch?v=EaJmzB8YgS0'),
            (3, 'https://www.youtube.com/watch?v=2dn13zneEjo'),
            (4, 'https://www.youtube.com/watch?v=AsZvN7b02S0'),
            (5, 'https://www.youtube.com/watch?v=qE8DcgVW44g')
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
        await connection.execute('DROP TABLE IF EXISTS notifications');
        await connection.execute('DROP TABLE IF EXISTS first_aid_guides');

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