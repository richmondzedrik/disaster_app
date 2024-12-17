const User = require('../models/User');
const crypto = require('crypto');

exports.getAllUsers = async (req, res) => {
    try {
        console.log('Getting all users, requested by:', req.user?.userId);
        
        const users = await User.findAll();
        console.log('Users found:', users.length);
        
        if (!users) {
            throw new Error('Database query failed');
        }
        
        res.json({
            success: true,
            data: users,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch users',
            errorCode: error.code
        });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        await User.setRole(userId, role);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password, adminKey } = req.body;
        
        // Debug log
        console.log('Received admin creation request:', { username, email, adminKey });
        
        // Verify admin creation key
        if (adminKey !== process.env.ADMIN_CREATION_KEY) {
            return res.status(403).json({ message: 'Invalid admin creation key' });
        }
        
        // Create admin user
        const userId = await User.create({
            username,
            email,
            password,
            role: 'admin'
        });
        
        res.status(201).json({ 
            message: 'Admin user created successfully',
            userId
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if user exists first
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        const result = await User.delete(userId);
        if (result) {
            res.status(200).json({ 
                success: true, 
                message: 'User deleted successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete user' 
            });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user', 
            error: error.message 
        });
    }
};

 