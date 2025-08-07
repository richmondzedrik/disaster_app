const mysql = require('mysql2/promise');
const config = require('../config/database');

async function up() {
    let connection;
    try {
        connection = await mysql.createConnection({
            ...config,
            ssl: false,
            connectionLimit: 1
        });
        
        await connection.beginTransaction();

        // Create disaster types table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS disaster_types (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                icon VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create disaster-specific guides table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS disaster_guides (
                id INT PRIMARY KEY AUTO_INCREMENT,
                disaster_type_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                priority INT DEFAULT 0,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Insert common disaster types
        await connection.execute(`
            INSERT IGNORE INTO disaster_types (name, icon, description) VALUES
            ('Hurricane', 'hurricane', 'Powerful tropical storms with heavy rain and strong winds'),
            ('Earthquake', 'earthquake', 'Sudden shaking of the ground caused by movement of tectonic plates'),
            ('Flood', 'flood', 'Overflow of water onto normally dry land'),
            ('Wildfire', 'fire', 'Uncontrolled fire that spreads quickly through vegetation'),
            ('Tornado', 'tornado', 'Violently rotating column of air that is in contact with the ground'),
            ('Winter Storm', 'snowflake', 'Severe winter weather with snow, ice, and extreme cold'),
            ('Pandemic', 'virus', 'Outbreak of infectious disease across a large region')
        `);

        await connection.commit();
        console.log('Successfully created disaster guides tables');
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Migration failed:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { up }; 