const { db } = require('../db/supabase-connection-cjs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
    static async findByEmail(email) {
        try {
            const result = await db.select('users', {
                where: { email: email },
                limit: 1
            });

            if (result.error) {
                console.error('Supabase error in findByEmail:', result.error);
                return null;
            }

            return result.data && result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            console.error('Error in findByEmail:', error);
            return null;
        }
    }

    static async findById(userId) {
        try {
            const result = await db.select('users', {
                select: 'id, username, email, phone, location, notifications, emergency_contacts, role, email_verified, created_at, updated_at, last_login, avatar_url',
                where: { id: userId },
                limit: 1
            });

            if (result.error) {
                console.error('Supabase error in findById:', result.error);
                return null;
            }

            if (!result.data || result.data.length === 0) return null;

            const user = result.data[0];
            
            try {
                // Handle notifications
                user.notifications = typeof user.notifications === 'string'
                    ? JSON.parse(user.notifications)
                    : user.notifications || {};

                // Handle emergency contacts
                if (user.emergency_contacts) {
                    const contacts = typeof user.emergency_contacts === 'string'
                        ? JSON.parse(user.emergency_contacts)
                        : user.emergency_contacts;
                    
                    user.emergencyContacts = Array.isArray(contacts) 
                        ? contacts.map(contact => ({
                            name: contact.name?.trim() || '',
                            phone: contact.phone?.trim() || '',
                            relation: contact.relation?.trim() || ''
                        }))
                        : [];
                } else {
                    user.emergencyContacts = [];
                }

                // Format last_login
                if (user.last_login) {
                    user.last_login = new Date(user.last_login).toISOString();
                } else {
                    user.last_login = new Date(user.created_at).toISOString();
                }

                // Remove snake_case version
                delete user.emergency_contacts;

            } catch (e) {
                console.error('Error parsing JSON fields:', e);
                user.notifications = {};
                user.emergencyContacts = [];
                user.last_login = new Date().toISOString();
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

            const result = await db.insert('users', {
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role || 'user',
                notifications: true
            });

            if (result.error) {
                console.error('Supabase error in create:', result.error);
                throw new Error('Failed to create user');
            }

            return {
                userId: result.data[0].id
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
                // Fix notifications handling
                notifications: typeof profileData.notifications === 'boolean' 
                    ? profileData.notifications 
                    : (typeof profileData.notifications === 'string'
                        ? profileData.notifications
                        : JSON.stringify(profileData.notifications || true)),
                emergency_contacts: typeof emergencyContacts === 'string'
                    ? emergencyContacts
                    : JSON.stringify(emergencyContacts)
            };

            console.log('Formatted emergency contacts:', formattedData.emergency_contacts);

            // Update user in database
            const result = await db.update('users', userId, {
                username: formattedData.username,
                phone: formattedData.phone,
                location: formattedData.location,
                notifications: formattedData.notifications,
                emergency_contacts: formattedData.emergency_contacts
            });

            if (result.error) {
                console.error('Supabase error in updateProfile:', result.error);
                throw new Error('Failed to update profile');
            }

            if (!result.data || result.data.length === 0) {
                throw new Error('User not found');
            }

            // Parse JSON fields for response
            try {
                // Handle notifications
                updatedUser.notifications = typeof updatedUser.notifications === 'string'
                    ? JSON.parse(updatedUser.notifications)
                    : updatedUser.notifications || {};

                // Handle emergency contacts
                if (typeof updatedUser.emergency_contacts === 'string') {
                    updatedUser.emergencyContacts = JSON.parse(updatedUser.emergency_contacts);
                } else if (updatedUser.emergency_contacts) {
                    updatedUser.emergencyContacts = updatedUser.emergency_contacts;
                } else {
                    updatedUser.emergencyContacts = [];
                }

                // Ensure it's an array
                if (!Array.isArray(updatedUser.emergencyContacts)) {
                    updatedUser.emergencyContacts = [];
                }

                // Remove the snake_case version to avoid confusion
                delete updatedUser.emergency_contacts;

            } catch (e) {
                console.error('Error parsing JSON fields:', e);
                updatedUser.notifications = {};
                updatedUser.emergencyContacts = [];
            }

            return updatedUser;
        } catch (error) {
            console.error('User.updateProfile error:', error);
            throw error;
        }
    }

    static async delete(userId) {
        try {
            // Delete user's related data first
            await db.delete('refresh_tokens', { user_id: userId });
            await db.delete('alert_reads', { user_id: userId });
            await db.delete('comments', { user_id: userId });
            await db.delete('likes', { user_id: userId });
            await db.delete('posts', { author_id: userId });

            // Finally delete the user
            const result = await db.delete('users', userId);

            if (result.error) {
                console.error('Supabase error in delete:', result.error);
                throw new Error('Failed to delete user');
            }

            return true;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    static async verifyEmail(token) {
        try {
            // First find the user with the token
            const userResult = await db.select('users', {
                where: { verification_token: token },
                limit: 1
            });

            if (userResult.error || !userResult.data || userResult.data.length === 0) {
                return {
                    success: false,
                    message: 'Invalid or expired token'
                };
            }

            const user = userResult.data[0];

            // Check if token is expired
            if (new Date(user.verification_token_expires) < new Date()) {
                return {
                    success: false,
                    message: 'Invalid or expired token'
                };
            }

            // Update user to verified
            const result = await db.update('users', user.id, {
                email_verified: true,
                verification_token: null,
                verification_token_expires: null
            });

            if (result.error) {
                throw new Error('Failed to verify email');
            }

            return {
                success: true,
                message: 'Email verified successfully'
            };
        } catch (error) {
            console.error('Error in verifyEmail:', error);
            throw error;
        }
    }

    static async updateVerificationCode(userId, code) {
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const result = await db.update('users', userId, {
                verification_code: code,
                verification_code_expires: expiresAt.toISOString()
            });

            if (result.error) {
                console.error('Supabase error in updateVerificationCode:', result.error);
                throw new Error('Failed to update verification code');
            }

            if (!result.data || result.data.length === 0) {
                throw new Error('Failed to update verification code');
            }

            // Verify the code was stored correctly
            if (result.data[0].verification_code !== code) {
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
            const result = await db.select('users', {
                where: { username: username },
                limit: 1
            });

            if (result.error) {
                console.error('Supabase error in findByUsername:', result.error);
                return null;
            }

            return result.data && result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            console.error('Error in findByUsername:', error);
            return null;
        }
    }

    static async update(userId, updates) {
        try {
            const result = await db.update('users', userId, updates);

            if (result.error) {
                console.error('Supabase error in update:', result.error);
                throw new Error('Failed to update user');
            }

            return result.data && result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
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

            // First find the user
            const userResult = await db.select('users', {
                where: { email: email },
                limit: 1
            });

            if (userResult.error || !userResult.data || userResult.data.length === 0) {
                throw new Error('No user found with that email');
            }

            // Update user with reset token
            const result = await db.update('users', userResult.data[0].id, {
                reset_token: hashedToken,
                reset_token_expires: expires.toISOString()
            });

            if (result.error) {
                throw new Error('Failed to set reset token');
            }

            return resetToken; // Return unhashed token for email
        } catch (error) {
            console.error('Set reset token error:', error);
            throw error;
        }
    }

    static async generateResetToken(email) {
        try {
            // Generate a random token
            const resetToken = crypto.randomBytes(32).toString('hex');
            // Token expires in 1 hour
            const resetTokenExpires = new Date(Date.now() + 3600000);

            // First find the user
            const userResult = await db.select('users', {
                where: { email: email },
                limit: 1
            });

            if (userResult.error || !userResult.data || userResult.data.length === 0) {
                return { success: false, message: 'Email not found' };
            }

            // Update the user with the reset token
            const result = await db.update('users', userResult.data[0].id, {
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires.toISOString()
            });

            if (result.error) {
                return { success: false, message: 'Failed to generate reset token' };
            }

            return {
                success: true,
                resetToken,
                message: 'Password reset token generated successfully'
            };
        } catch (error) {
            console.error('Error in generateResetToken:', error);
            throw error;
        }
    }

    static async resetPassword(token, newPassword) {
        try {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // First find user with valid token
            const userResult = await db.select('users', {
                where: { reset_token: token },
                limit: 1
            });

            if (userResult.error || !userResult.data || userResult.data.length === 0) {
                return {
                    success: false,
                    message: 'Invalid or expired reset token'
                };
            }

            const user = userResult.data[0];

            // Check if token is expired
            if (new Date(user.reset_token_expires) < new Date()) {
                return {
                    success: false,
                    message: 'Invalid or expired reset token'
                };
            }

            // Update user's password and clear reset token
            const result = await db.update('users', user.id, {
                password: hashedPassword,
                reset_token: null,
                reset_token_expires: null
            });

            if (result.error) {
                throw new Error('Failed to reset password');
            }

            return {
                success: true,
                message: 'Password updated successfully'
            };
        } catch (error) {
            console.error('Error in resetPassword:', error);
            throw error;
        }
    }

    static async verifyCode(email, code) {
        try {
            // First check if the code exists and is valid
            const userResult = await db.select('users', {
                where: {
                    email: email,
                    verification_code: code
                },
                limit: 1
            });

            if (userResult.error || !userResult.data || userResult.data.length === 0) {
                return {
                    success: false,
                    message: 'Invalid or expired verification code'
                };
            }

            const user = userResult.data[0];

            // Check if code is expired
            if (new Date(user.verification_code_expires) < new Date()) {
                return {
                    success: false,
                    message: 'Invalid or expired verification code'
                };
            }

            // If code is valid, update the user
            const result = await db.update('users', user.id, {
                email_verified: true,
                verification_code: null,
                verification_code_expires: null
            });

            if (result.error) {
                throw new Error('Failed to verify code');
            }

            return {
                success: true,
                message: 'Email verified successfully! Please login to continue'
            };
        } catch (error) {
            console.error('Error in verifyCode:', error);
            throw error;
        }
    }
}

module.exports = User; 