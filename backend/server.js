require('dotenv').config();
const express = require('express');
const app = require('./app');
const db = require('./db/connection');
const path = require('path');
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://disasterapp-u794h5q0t-richmondzedriks-projects.vercel.app']
    : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Environment checks
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('Critical Error: JWT secrets not set in environment variables');
    process.exit(1);
}

// Test database connection
async function testDbConnection() {
    try {
        await db.execute('SELECT 1');
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
        await testDbConnection();
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel
module.exports = app;