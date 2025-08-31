require('dotenv').config();
const app = require('./app');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const express = require('express');

// Import Supabase connection instead of MySQL
const { testConnection } = require('./db/supabase-connection');

const PORT = process.env.PORT || 3000; 

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('error', console.error);
});

// Store WSS instance on app
app.locals.wss = wss;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        console.log('🧪 Testing Supabase connection...');
        const connected = await testConnection();
        if (connected) {
            console.log('✅ Supabase connected successfully');
            console.log('📡 Connected to:', {
                url: process.env.SUPABASE_URL,
                database: process.env.DB_NAME,
                host: process.env.DB_HOST
            });
            return true;
        } else {
            console.error('❌ Supabase connection failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Supabase connection error:', error);
        return false;
    }
}

// Start server with Supabase
async function startServer() { 
    try {
        // Test Supabase connection first
        const dbConnected = await testSupabaseConnection();
        if (!dbConnected) {
            console.error('❌ Supabase connection failed - cannot start server');
            console.log('💡 Make sure your Supabase credentials are correct in .env');
            console.log('💡 Make sure tables are created in Supabase dashboard');
            process.exit(1);
        }

        // Start the server
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Database: Supabase PostgreSQL`);
            console.log(`📡 Supabase URL: ${process.env.SUPABASE_URL}`);
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔗 Local server: http://localhost:${PORT}`);
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = server;
