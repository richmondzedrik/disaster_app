require('dotenv').config();
const express = require('express');
const app = require('./app');
const db = require('./db/connection');
const checklistRoutes = require('./routes/checklist');
const auth = require('./middleware/auth');
const path = require('path');
const fs = require('fs');
const checkBuild = require('./utils/buildCheck');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
    console.error('Critical Error: JWT_SECRET is not set in environment variables');
    process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not set in environment variables');
    process.exit(1);
}

// Test database connection on startup
async function testDbConnection() {
    try {
        await db.execute('SELECT 1');
        console.log('Database connection successful');
    } catch (error) {
        console.error('Database connection failed:', error);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('Please verify your database credentials in .env file');
        }
        process.exit(1);
    }
}

// Start server only after DB connection is verified
async function startServer() {
    await testDbConnection();
    
    // Log all registered routes for debugging
    console.log('\nRegistered Routes:');
    try {
        const routes = app._router.stack
            .filter(layer => layer.route || (layer.name === 'router' && layer.handle.stack))
            .reduce((endpoints, layer) => {
                if (layer.route) {
                    const path = layer.route.path;
                    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                    endpoints.push(`${methods} ${path}`);
                } else {
                    layer.handle.stack.forEach(handler => {
                        if (handler.route) {
                            const path = handler.route.path;
                            const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
                            endpoints.push(`${methods} ${path}`);
                        }
                    });
                }
                return endpoints;
            }, []);

        routes.forEach(route => console.log(route));
    } catch (error) {
        console.log('Could not log routes:', error.message);
    }

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle SPA routing - add this after your API routes
app.get('*', (req, res) => {
  // Check if dist directory exists
  const distPath = path.join(__dirname, '../frontend/dist/index.html');
  try {
    res.sendFile(distPath);
  } catch (error) {
    console.error('Error serving frontend:', error);
    res.status(500).send('Error loading application. Please ensure the frontend is built.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Check build before starting server
if (process.env.NODE_ENV === 'production') {
  checkBuild();
}

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://disaster-app.onrender.com'
    : 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));

// Start the server
// startServer();

// Instead, export the app
module.exports = app;