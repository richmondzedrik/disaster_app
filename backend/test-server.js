require('dotenv').config();
const express = require('express');
const { testConnection } = require('./db/supabase-connection-cjs');

const app = express();
const PORT = 3001; // Use different port to avoid conflicts

console.log('🚀 Starting simple test server...');

async function startServer() {
    try {
        console.log('🧪 Testing Supabase connection...');
        const connected = await testConnection();
        
        if (connected) {
            console.log('✅ Supabase connection successful');
        } else {
            console.log('❌ Supabase connection failed');
        }
        
        // Simple test route
        app.get('/test', (req, res) => {
            res.json({ 
                success: true, 
                message: 'Server is running with Supabase',
                timestamp: new Date().toISOString()
            });
        });
        
        app.listen(PORT, () => {
            console.log(`🎉 Test server running on port ${PORT}`);
            console.log(`🔗 Test URL: http://localhost:${PORT}/test`);
        });
        
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

startServer();
