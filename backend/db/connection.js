require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config/database');

const pool = mysql.createPool({
  ...config,
  ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
  } : false,
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 10,
  acquireTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Track active connections
let activeConnections = 0;

// Add connection tracking
pool.on('acquire', () => {
    activeConnections++;
    console.log(`Connection acquired. Active connections: ${activeConnections}`);
});

pool.on('release', () => {
    activeConnections--;
    console.log(`Connection released. Active connections: ${activeConnections}`);
});

// Add connection error recovery
pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.error('Connection lost. Attempting to reconnect...');
        // Allow pool to handle reconnection
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Too many connections. Waiting for available connection...');
        // Connection will be queued automatically
    }
});

// Force release idle connections periodically
setInterval(async () => {
    if (activeConnections > 3) { // If more than 60% of connections are active
        try {
            await pool.query('SELECT 1'); // Keep one connection alive
            pool._freeConnections.forEach(conn => {
                if (conn.lastActiveTime && Date.now() - conn.lastActiveTime > 30000) {
                    conn.destroy(); // Release connections idle for more than 30 seconds
                    activeConnections--;
                }
            });
        } catch (error) {
            console.error('Connection cleanup error:', error);
        }
    }
}, 30000);

// Add connection error handling
pool.on('connection', (connection) => {
  console.log('New connection established');
  
  // Set session timeout
  connection.query('SET SESSION wait_timeout=60');
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