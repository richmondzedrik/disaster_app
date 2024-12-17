require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-default-secret-key',
    jwtExpiration: '15m',
    refreshTokenExpiration: '7d',
    port: process.env.PORT || 3000,
    database: {
        url: process.env.DATABASE_URL
    }
}; 