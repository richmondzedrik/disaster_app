require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'disaster_user',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'disaster_prep',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

module.exports = config; 