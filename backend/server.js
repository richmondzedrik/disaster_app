require('dotenv').config();
const app = require('./app');
const http = require('http');
const WebSocket = require('ws');
const db = require('./db/connection');
const path = require('path');
const fs = require('fs');

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
}

// Verify environment variables
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('Critical Error: JWT secrets not set in environment variables');
    process.exit(1);
}

// Test database connection
async function testDbConnection() {
    try {
        await db.execute('SELECT 1');
        console.log('Database connection successful');
        console.log('Connected to:', {
            host: process.env.RAILWAY_DB_HOST || process.env.DB_HOST,
            database: process.env.RAILWAY_DB_NAME || process.env.DB_NAME,
            port: process.env.RAILWAY_DB_PORT || process.env.DB_PORT
        });
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('Please verify your database credentials in .env file');
        }
        return false;
    }
}

// Start server
async function startServer() {
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
        process.exit(1);
    }

    // Log registered routes
    console.log('\nRegistered Routes:');
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    console.log(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
                }
            });
        }
    });
    
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        if (process.env.NODE_ENV === 'production') {
            console.log('Running in production mode');
        } else {
            console.log(`Development server at http://localhost:${PORT}`);
        }
    });
}

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

startServer();