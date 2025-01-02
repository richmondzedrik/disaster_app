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

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://disaster-app.onrender.com'
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        next();
    });
}

// Static file serving
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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
app.use('/api/admin/news', adminNewsRoutes);
app.use('/api/admin', adminRoutes);

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

// SPA routes handler
const spaRoutes = [
    '/',
    '/login',
    '/register',
    '/admin*',
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
];

app.get(spaRoutes, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: `API route not found: ${req.method} ${req.url}`
        });
    }
    // For non-API routes, serve the SPA
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

module.exports = app;