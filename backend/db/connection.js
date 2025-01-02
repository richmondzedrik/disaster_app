require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

const pool = mysql.createPool({
    ...config,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Add a test query function
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        
        // Test users table structure
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users
        `);
        console.log('Users table structure:', columns);
        
        connection.release();
    } catch (error) {
        console.error('Database connection error:', error);
        console.error('Connection details:', {
            host: config.host,
            user: config.user,
            database: config.database,
            port: config.port
        });
    }
}

module.exports = pool;
module.exports.testConnection = testConnection;