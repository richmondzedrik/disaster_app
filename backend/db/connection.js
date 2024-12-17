require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'disaster_user',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'disaster_prep',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
    }
}

module.exports = pool;
module.exports.testConnection = testConnection; 