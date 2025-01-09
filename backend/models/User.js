const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
    static async findByEmail(email) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }

    static async findById(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT id, username, email, phone, location, notifications, 
                emergency_contacts, role, email_verified, created_at, updated_at,
                last_login 
                FROM users WHERE id = ?`,
                [userId]
            );

            if (rows.length === 0) return null;

            const user = rows[0];
            
            // Parse emergency contacts with better error handling
            try {
                if (user.emergency_contacts) {
                    // If it's a string, parse it
                    if (typeof user.emergency_contacts === 'string') {
                        user.emergencyContacts = JSON.parse(user.emergency_contacts);
                    } else {
                        // If it's already an object, use it directly
                        user.emergencyContacts = user.emergency_contacts;
                    }
                    
                    // Ensure it's an array
                    if (!Array.isArray(user.emergencyContacts)) {
                        user.emergencyContacts = [];
                    }
                    
                    // Validate each contact
                    user.emergencyContacts = user.emergencyContacts
                        .filter(contact => contact && contact.name && contact.phone && contact.relation)
                        .map(contact => ({
                            name: contact.name.trim(),
                            phone: contact.phone.trim(),
                            relation: contact.relation.trim()
                        }));
                } else {
                    user.emergencyContacts = [];
                }
                
                // Remove the snake_case version
                delete user.emergency_contacts;
                
            } catch (e) {
                console.error('Error parsing emergency contacts:', e);
                user.emergencyContacts = [];
            }

            // Ensure last_login is properly formatted
            if (user.last_login) {
                user.last_login = new Date(user.last_login).toISOString();
            }

            return user;
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    static async create(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [
                    userData.username, 
                    userData.email, 
                    hashedPassword, 
                    userData.role || 'user'
                ]
            );

            return {
                userId: result.insertId
            };
        } catch (error) {
            console.error('Error in create:', error); 
            throw error;
        }
    }

    static async updateProfile(userId, profileData) {
        try {
            // Ensure emergency contacts is a valid array
            let emergencyContacts = [];
            if (profileData.emergencyContacts) {
                emergencyContacts = Array.isArray(profileData.emergencyContacts) 
                    ? profileData.emergencyContacts
                    : [];
                    
                // Validate each contact
                emergencyContacts = emergencyContacts
                    .filter(contact => contact && contact.name && contact.phone && contact.relation)
                    .map(contact => ({
                        name: contact.name.trim(),
                        phone: contact.phone.trim(),
                        relation: contact.relation.trim()
                    }));
            }

            // Format the data before updating
            const formattedData = {
                username: profileData.username,
                phone: profileData.phone,
                location: profileData.location,
                // Only stringify if it's not already a string
                notifications: typeof profileData.notifications === 'string' 
                    ? profileData.notifications 
                    : JSON.stringify(profileData.notifications || {}),
                // Only stringify if it's not already a string
                emergency_contacts: typeof emergencyContacts === 'string'
                    ? emergencyContacts
                    : JSON.stringify(emergencyContacts)
            };

            console.log('Formatted emergency contacts:', formattedData.emergency_contacts);

            // Update user in database
            const [result] = await db.execute(
                `UPDATE users 
                 SET username = ?, 
                     phone = ?, 
                     location = ?, 
                     notifications = ?,
                     emergency_contacts = ?
                 WHERE id = ?`,
                [
                    formattedData.username,
                    formattedData.phone,
                    formattedData.location,
                    formattedData.notifications,
                    formattedData.emergency_contacts,
                    userId
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('User not found');
            }

            // Fetch updated user and verify the data
            const [rows] = await db.execute(
                `SELECT id, username, email, phone, location, notifications, 
                 emergency_contacts, role, email_verified, created_at, updated_at 
                 FROM users WHERE id = ?`,
                [userId]
            );

            if (!rows.length) {
                throw new Error('User not found');
            }

            const user = rows[0];
            
            // Parse JSON fields for response
            try {
                // Handle notifications
                user.notifications = typeof user.notifications === 'string'
                    ? JSON.parse(user.notifications)
                    : user.notifications || {};

                // Handle emergency contacts
                if (typeof user.emergency_contacts === 'string') {
                    user.emergencyContacts = JSON.parse(user.emergency_contacts);
                } else if (user.emergency_contacts) {
                    user.emergencyContacts = user.emergency_contacts;
                } else {
                    user.emergencyContacts = [];
                }
                
                // Ensure it's an array
                if (!Array.isArray(user.emergencyContacts)) {
                    user.emergencyContacts = [];
                }
                
                // Log the parsed data for debugging
                console.log('Updated user emergency contacts:', user.emergencyContacts);
                
                // Remove the snake_case version to avoid confusion
                delete user.emergency_contacts;
                
            } catch (e) {
                console.error('Error parsing JSON fields:', e);
                console.error('Raw notifications:', user.notifications);
                console.error('Raw emergency_contacts:', user.emergency_contacts);
                user.notifications = {};
                user.emergencyContacts = [];
            }

            return user;
        } catch (error) {
            console.error('User.updateProfile error:', error);
            throw error;
        }
    }

    static async delete(userId) {
        try {
            // Start a transaction
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Delete user's related data first (if any)
                // For example: refresh tokens, user preferences, etc.  
                await connection.execute(
                    'DELETE FROM refresh_tokens WHERE user_id = ?',
                    [userId]
                );

                // Delete the user
                const [result] = await connection.execute(
                    'DELETE FROM users WHERE id = ?',
                    [userId]
                );

                await connection.commit();
                return result.affectedRows > 0;
            } catch (error) { 
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    static async verifyEmail(token) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET email_verified = true WHERE verification_token = ? AND verification_token_expires > NOW()',
                [token]
            );
            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0 ? 'Email verified successfully' : 'Invalid or expired token'
            };
        } catch (error) {
            console.error('Error in verifyEmail:', error);
            throw error;
        }
    }

    static async updateVerificationCode(userId, code) {
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            const [result] = await db.execute(
                'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE id = ?',
                [code, expiresAt, userId]
            );
            
            // Verify the update was successful
            if (result.affectedRows === 0) {
                throw new Error('Failed to update verification code');
            }
            
            // Double-check the code was stored
            const [verifyResult] = await db.execute(
                'SELECT verification_code FROM users WHERE id = ?',
                [userId]
            );
            
            if (!verifyResult[0] || verifyResult[0].verification_code !== code) {
                throw new Error('Verification code mismatch after update');
            }
            
            return true;
        } catch (error) {
            console.error('Error in updateVerificationCode:', error);
            throw error;
        }
    }

    static async findByUsername(username) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }

    static async update(userId, updates) {
        const fields = Object.keys(updates);
        const values = Object.values(updates);

        const setClause = fields.map((field, index) => `${field} = ?`).join(', ');

        const [result] = await db.execute(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            [...values, userId]
        );

        return result;
    }

    static async setResetToken(email) {
        try {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto  
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Set expiration to 1 hour from now
            const expires = new Date(Date.now() + 3600000); // 1 hour

            // Update user with reset token
            const [result] = await db.query(`
                UPDATE users 
                SET reset_token = ?, 
                    reset_token_expires = ? 
                WHERE email = ?
            `, [hashedToken, expires, email]);

            if (result.affectedRows === 0) {
                throw new Error('No user found with that email');
            }

            return resetToken; // Return unhashed token for email
        } catch (error) {
            console.error('Set reset token error:', error);
            throw error;
        }
    }

    static async resetPassword(token, newPassword) {
        try {
            if (!token || !newPassword) {
                return {
                    success: false,
                    message: 'Token and new password are required'
                };
            }

            // Hash the token to compare with stored hash
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Find user with valid reset token
            const [rows] = await db.query(
                `SELECT id 
                 FROM users 
                 WHERE reset_token = ? 
                 AND reset_token_expires > NOW()`,
                [hashedToken]
            );

            if (!rows || rows.length === 0) {
                return {
                    success: false,
                    message: 'Invalid or expired reset token'
                };
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear reset token
            await db.query(
                `UPDATE users 
                 SET password = ?, 
                     reset_token = NULL, 
                     reset_token_expires = NULL 
                 WHERE id = ?`,
                [hashedPassword, rows[0].id]
            );

            return {
                success: true,
                message: 'Password reset successful'
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: 'Failed to reset password'
            };
        }
    }

    static async verifyCode(email, code) {
        try {
            // First check if the code exists and is valid
            const [user] = await db.execute(
                `SELECT * FROM users 
                 WHERE email = ? 
                 AND verification_code = ?
                 AND verification_code_expires > NOW()`,
                [email, code]
            );
    
            if (!user[0]) {
                return {
                    success: false,
                    message: 'Invalid or expired verification code'
                };
            }
    
            // If code is valid, update the user
            const [result] = await db.execute(
                `UPDATE users 
                 SET email_verified = true,
                     verification_code = NULL,
                     verification_code_expires = NULL
                 WHERE email = ? 
                 AND verification_code = ?`,
                [email, code]
            );
    
            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0 
                    ? 'Email verified successfully! Please login to continue'
                    : 'Verification failed. Please try again.'
            };
        } catch (error) {
            console.error('Error in verifyCode:', error);
            throw error;
        }
    }
}

module.exports = User; 