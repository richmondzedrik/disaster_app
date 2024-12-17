const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/connection');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        let token = authHeader;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
        
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.userId || !decoded.role) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            }
            
            req.token = token;
            req.user = decoded;
            next();
        } catch (jwtError) {
            console.error('JWT Verification failed:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
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