require('dotenv').config();

const config = {
    host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'disaster_user',
    password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || 'admin',
    database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'disaster_prep',
    port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        ssl: true
    } : false
};

module.exports = config;