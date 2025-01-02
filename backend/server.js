require('dotenv').config();
const app = require('./app');
const http = require('http');
const WebSocket = require('ws');
const db = require('./db/connection');
const path = require('path');
const fs = require('fs');
const express = require('express');
const runMigrations = require('./migrations/runMigrations');
const config = require('./config/database');

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

// Global error logger
const logError = (error, context) => {
    console.error({
        timestamp: new Date().toISOString(),
        context,
        error: {
            message: error.message,
            stack: error.stack,
            code: error.code
        }
    });
};

// Global success logger
const logSuccess = (message, data) => {
    console.log({
        timestamp: new Date().toISOString(),
        message,
        data
    });
};

// Make loggers global
global.logError = logError;
global.logSuccess = logSuccess;

// Authentication event logging middleware
app.use((req, res, next) => {
    if (req.path.startsWith('/auth')) {
        console.log({
            timestamp: new Date().toISOString(),
            type: 'Auth Request',
            method: req.method,
            path: req.path,
            body: req.path.includes('password') ? '***' : req.body
        });
    }
    next();
});

// Email service logging
const originalSendEmail = require('./utils/email').sendVerificationEmail;
const { sendVerificationEmail } = require('./utils/email');

// Wrap the email sending function to add logging
exports.sendVerificationEmail = async (email, code) => {
    console.log({
        timestamp: new Date().toISOString(),
        type: 'Email Attempt',
        email,
        code: '******' // Don't log actual code
    });
    
    try {
        const result = await originalSendEmail(email, code);
        console.log({
            timestamp: new Date().toISOString(),
            type: 'Email Success',
            email
        });
        return result;
    } catch (error) {
        console.error({
            timestamp: new Date().toISOString(),
            type: 'Email Error',
            email,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
        throw error;
    }
};

// Database query logging
const originalExecute = db.execute;

async function checkDatabaseTables() {
    try {
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [config.database]);
        
        const tableNames = tables.map(t => t.TABLE_NAME);
        console.log('Available tables:', tableNames);
        
        // Check for required tables
        const requiredTables = ['users', 'posts', 'alerts', 'comments', 'likes'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length > 0) {
            console.error('Missing required tables:', missingTables);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Database table check failed:', error);
        console.error('Database config:', {
            host: config.host,
            database: config.database,
            port: config.port
        });
        return false;
    }
};

// Test database connection
async function testDbConnection() {
    try {
        await db.execute('SELECT 1');
        console.log('Database connection successful');
        console.log('Connected to:', {
            host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST,
            database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME,
            port: process.env.MYSQL_ADDON_PORT || process.env.DB_PORT
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

async function checkDatabaseTables() {
    try {
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [config.database]);
        
        console.log('Available tables:', tables.map(t => t.TABLE_NAME));
        return true;
    } catch (error) {
        console.error('Database table check failed:', error);
        return false;
    }
}

// Start server
async function startServer() {
    try {
        // Test database connection first
        const dbConnected = await testDbConnection();
        if (!dbConnected) {
            console.error('Database connection failed');
            process.exit(1);
        }

        // Run migrations before checking tables
        console.log('Running database migrations...');
        const migrationsSuccessful = await runMigrations();
        if (!migrationsSuccessful) {
            console.error('Failed to run migrations');
            process.exit(1);
        }
        console.log('Migrations completed successfully');

        // Check tables after migrations
        const tablesExist = await checkDatabaseTables();
        if (!tablesExist) {
            console.error('Required database tables are missing after migrations');
            process.exit(1);
        }

        // Start the server
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`Database: ${config.database}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

startServer();