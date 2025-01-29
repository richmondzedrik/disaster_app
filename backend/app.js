const express = require('express');
const cors = require('cors');
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');
const checklistRoutes = require('./routes/checklist');
const newsRoutes = require('./routes/news');
const adminNewsRoutes = require('./routes/admin/news');
const notificationTestRoutes = require('./routes/notificationTests');
const notificationRoutes = require('./routes/notifications');
const markersRoutes = require('./routes/markers');
const contactRoutes = require('./routes/contact');

const app = express();

// Move these lines BEFORE any route definitions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
    origin: [
        'https://disasterapp.netlify.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.set('trust proxy', true);

app.use(cors(corsOptions));

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend connection successful',
        timestamp: new Date().toISOString()
    });
});

// Add the new database test route
app.get('/api/db-test', async (req, res) => {
    try {
        const db = require('./db/connection');
        await db.execute('SELECT 1');
        res.json({ 
            success: true, 
            message: 'Database connected successfully' 
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: error.message 
        });
    }
});

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        next();
    });
}

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/checklist', checklistRoutes); 
app.use('/api/news', newsRoutes);
app.use('/admin/news', adminNewsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/news', newsRoutes);
app.use('/api/alerts', require('./routes/alerts'));
app.use('/auth', authRoutes);
app.use('/api', notificationTestRoutes);
app.use('/api/markers', markersRoutes);
app.use('/api/hazard-zones', hazardZonesRoutes);
app.use('/api/contact', contactRoutes);

// Route debugging endpoint in development         
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug-routes', (req, res) => {
        const routes = [];
        app._router.stack.forEach(middleware => {
            if (middleware.name === 'router') {
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
}

// 404 handler
app.use((req, res) => {
    // Only handle API routes
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: `API route not found: ${req.method} ${req.url}`
        });
    } else {
        // For non-API routes, return a simple 404
        res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Add after your existing middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log({
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
    });
    next();
});

module.exports = app;