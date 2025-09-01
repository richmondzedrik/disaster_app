// Keep-alive service to prevent Render free tier from sleeping
const https = require('https');

const BACKEND_URL = 'https://disaster-app.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

function pingBackend() {
    const url = `${BACKEND_URL}/health`;
    
    https.get(url, (res) => {
        console.log(`✅ Keep-alive ping successful: ${res.statusCode}`);
    }).on('error', (err) => {
        console.error('❌ Keep-alive ping failed:', err.message);
    });
}

// Only run keep-alive in production
if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Starting keep-alive service...');
    
    // Initial ping
    pingBackend();
    
    // Set up interval
    setInterval(pingBackend, PING_INTERVAL);
    
    console.log(`⏰ Keep-alive service running (ping every ${PING_INTERVAL / 60000} minutes)`);
}

module.exports = { pingBackend };
