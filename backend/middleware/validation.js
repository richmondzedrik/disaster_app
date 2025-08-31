const { db } = require('../db/supabase-connection-cjs');

const validateRegistration = async (req, res, next) => {
    const { username, email, password } = req.body;
    
    // Check for missing fields with specific messages
    if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Username is required'
        });
    }
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email address is required'
        });
    }
    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address (e.g., user@example.com)'
        });
    }

    // Enhanced username validation
    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Username is too short (minimum 3 characters)'
        });
    }
    if (username.length > 20) {
        return res.status(400).json({
            success: false,
            message: 'Username is too long (maximum 20 characters)'
        });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({
            success: false,
            message: 'Username can only contain letters, numbers, underscores, and hyphens'
        });
    }

    // Enhanced password validation
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long'
        });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must contain at least one uppercase letter'
        });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must contain at least one lowercase letter'
        });
    }
    if (!/[0-9]/.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must contain at least one number'
        });
    }

    try {
        // Check for existing email
        const emailResult = await db.select('users', {
            select: 'email',
            where: { email: email },
            limit: 1
        });

        if (emailResult.error) {
            console.error('Database error checking email:', emailResult.error);
            throw new Error('Database query failed');
        }

        if (emailResult.data && emailResult.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email address is already registered. Please use a different email or try logging in'
            });
        }

        // Check for existing username
        const usernameResult = await db.select('users', {
            select: 'username',
            where: { username: username },
            limit: 1
        });

        if (usernameResult.error) {
            console.error('Database error checking username:', usernameResult.error);
            throw new Error('Database query failed');
        }

        if (usernameResult.data && usernameResult.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This username is already taken. Please choose a different username'
            });
        }

        next();
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while validating your information. Please try again'
        });
    }
};

const validateUsername = async (req, res, next) => {
    const { username } = req.body;
    const userId = req.user?.userId;

    try {
        // Enhanced username format validation
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }
        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username is too short (minimum 3 characters)'
            });
        }
        if (username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Username is too long (maximum 20 characters)'
            });
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Enhanced restricted words check
        const restrictedWords = ['admin', 'administrator', 'mod', 'moderator', 'support'];
        const lowercaseUsername = username.toLowerCase();
        if (restrictedWords.some(word => lowercaseUsername.includes(word))) {
            return res.status(400).json({
                success: false,
                message: `Username cannot contain restricted words: ${restrictedWords.join(', ')}`
            });
        }

        // Check for existing username using Supabase
        let result;
        if (userId) {
            // For updates - check if username exists for other users
            result = await db.supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .neq('id', userId)
                .limit(1);
        } else {
            // For new registrations - check if username exists at all
            result = await db.select('users', {
                select: 'id',
                where: { username: username },
                limit: 1
            });
        }

        if (result.error) {
            console.error('Database error:', result.error);
            throw new Error('Database query failed');
        }

        if (result.data && result.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This username is already taken. Please choose a different username'
            });
        }

        next();
    } catch (error) {
        console.error('Username validation error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking username availability. Please try again'
        });
    }
};

const validateUsernamePublic = async (req, res) => {
    const { username } = req.body;

    try {
        // Basic validation
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }
        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username is too short (minimum 3 characters)'
            });
        }
        if (username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Username is too long (maximum 20 characters)'
            });
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username can only contain letters, numbers, underscores, and hyphens'
            });
        }

        // Check restricted words
        const restrictedWords = ['admin', 'administrator', 'mod', 'moderator', 'support'];
        const lowercaseUsername = username.toLowerCase();
        if (restrictedWords.some(word => lowercaseUsername.includes(word))) {
            return res.status(400).json({
                success: false,
                message: `Username cannot contain restricted words: ${restrictedWords.join(', ')}`
            });
        }

        // Check availability using Supabase
        const result = await db.select('users', {
            select: 'id',
            where: { username: username },
            limit: 1
        });

        if (result.error) {
            console.error('Database error:', result.error);
            throw new Error('Database query failed');
        }

        if (result.data && result.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This username is already taken'
            });
        }

        return res.json({
            success: true,
            message: 'Username is available'
        });
    } catch (error) {
        console.error('Username validation error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking username availability'
        });
    }
};

const validateEmailPublic = async (req, res) => {
    const { email } = req.body;

    try {
        // Basic validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check availability using Supabase
        const result = await db.select('users', {
            select: 'id',
            where: { email: email },
            limit: 1
        });

        if (result.error) {
            console.error('Database error:', result.error);
            throw new Error('Database query failed');
        }

        if (result.data && result.data.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        return res.json({
            success: true,
            message: 'Email is available'
        });
    } catch (error) {
        console.error('Email validation error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking email availability'
        });
    }
};

module.exports = {
    validateRegistration,
    validateUsername,
    validateUsernamePublic,
    validateEmailPublic
};
