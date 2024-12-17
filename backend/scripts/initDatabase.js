const mysql = require('mysql2/promise');
const config = require('../config/database');

async function initDatabase() {
    const { database, ...connectionConfig } = config;
    
    try {
        // Create connection without database selected
        const connection = await mysql.createConnection(connectionConfig);
        
        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${database}`);
        console.log(`Database ${database} created or already exists`);
        
        // Use the database
        await connection.query('USE disaster_prep');
        console.log(`Using database ${database}`);
        
        await connection.end();
        
        console.log('Database initialization completed');
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

// Run if this file is executed directly
if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = initDatabase; 