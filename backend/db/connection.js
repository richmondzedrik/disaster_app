require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

const pool = mysql.createPool({
  ...config,
  ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
  } : false,
  connectionLimit: 3, // Reduced from 10
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 60000 // Close idle connections after 60 seconds
});

// Add connection error handling
pool.on('connection', (connection) => {
  console.log('New connection established');
  
  // Set session timeout
  connection.query('SET SESSION wait_timeout=60');
});

// Add periodic connection cleanup
setInterval(() => {
  pool.query('SELECT 1')
      .catch(err => console.error('Connection cleanup error:', err));
}, 30000);

pool.on('error', (err) => {
  console.error('Database pool error:', err);
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