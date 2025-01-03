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
    connectionLimit: 3,  // Reduced from default 10 to 3
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000, // 10 seconds
    timeout: 10000, // 10 seconds
    idleTimeout: 60000, // 1 minute
});

const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        if (error.code === 'ER_USER_LIMIT_REACHED') {
            // Wait for 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getConnection(); // Retry
        }
        throw error;
    }
};

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
module.exports.getConnection = getConnection;