require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

const pool = mysql.createPool({
    host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST,
    user: process.env.MYSQL_ADDON_USER || process.env.DB_USER,
    password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME,
    port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 3,  // Reduce from default 10 to 3
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    console.log('Connected to:', {
      host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST,
      database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME,
      port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT
    });
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    if (error.code === 'HANDSHAKE_NO_SSL_SUPPORT') {
      console.error('SSL connection failed. Trying without SSL...');
      // Try reconnecting without SSL
      const noSslPool = mysql.createPool({
        ...config,
        ssl: false
      });
      await noSslPool.getConnection();
      console.log('Connected successfully without SSL');
      return true;
    }
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;