const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');
const checklistRoutes = require('./routes/checklist');
const newsRoutes = require('./routes/news');
const adminNewsRoutes = require('./routes/admin/news');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log('Request:', req.method, req.path, req.body);
    next();
});

// Middleware for static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin/news', adminNewsRoutes);
app.use('/api/admin', adminRoutes);

// Add this before mounting routes
console.log('Mounting admin routes at /api/admin');

// Debug route registration
app._router.stack.forEach(middleware => {
    if (middleware.route) {
        console.log(`Route: ${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
            if (handler.route) {
                console.log(`Router Route: ${Object.keys(handler.route.methods)} ${handler.route.path}`);
            }
        });
    }
});

// Add this after mounting all routes but before error handlers
app.get('/api/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

// Handle all frontend routes
app.get([
    '/',
    '/login',
    '/register',
    '/admin*',  // This will catch all admin routes
    '/dashboard',
    '/profile',
    '/alerts',
    '/hazard-map',
    '/checklist',
    '/about',
    '/contact',
    '/news',
    '/verify-code',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/change-password'
], (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 404 handler
app.use((req, res) => {
    // Handle API routes
    if (req.path.startsWith('/api')) {
        res.status(404).json({
            success: false,
            message: `API route not found: ${req.method} ${req.url}`
        });
        return;
    }
    
    // For all other routes, serve the SPA
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('error', console.error);
});

// Export the WebSocket server instance
app.locals.wss = wss;

// Add this after mounting the route in app.js
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log('Route:', r.route.path)
    }
});

// Admin routes
app.use('/api/admin/news', require('./routes/admin/news'));

// Add after line 56
app.get('/api/debug-routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: `/api/news${handler.route.path}`,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Add this before the 404 handler
app.use('/api/news', require('./routes/news'));

module.exports = app;