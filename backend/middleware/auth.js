const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/connection');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists and is verified
        const [users] = await db.execute(
            'SELECT id, username, role, email_verified FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!users.length) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = {
            userId: users[0].id,
            username: users[0].username,
            role: users[0].role,
            isVerified: users[0].email_verified === 1
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        // Check if user exists and has valid admin role
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Verify token is still valid
        try {
            jwt.verify(req.headers.authorization.slice(7), process.env.JWT_SECRET);
        } catch (tokenError) {
            return res.status(401).json({
                success: false,
                message: 'Session expired'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware
};