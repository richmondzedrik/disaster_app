const db = require('../db/connection');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function testProfileUpdate() {
    let createdUserId;
    try {
        // 1. Create a test user first
        const testUserData = {
            username: 'testuser_temp',
            email: 'test@example.com',
            password: await bcrypt.hash('password123', 10),
            role: 'user'
        };

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [testUserData.username, testUserData.email, testUserData.password, testUserData.role]
        );

        createdUserId = result.insertId;
        console.log('Test user created with ID:', createdUserId);

        // 2. Update the user's profile
        const updateData = {
            username: 'testuser_updated',
            phone: '+639123456789',
            location: 'Test Location',
            notifications: {
                email: true,
                push: true
            },
            emergencyContacts: [{
                name: 'Emergency Contact',
                phone: '+639123456789'
            }]
        };

        // Attempt update
        const updatedUser = await User.updateProfile(createdUserId, updateData);
        console.log('Update successful:', updatedUser);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // 3. Clean up - delete the test user
        if (createdUserId) {
            try {
                await db.execute('DELETE FROM users WHERE id = ?', [createdUserId]);
                console.log('Test user cleaned up successfully');
            } catch (cleanupError) {
                console.error('Failed to clean up test user:', cleanupError);
            }
        }
        await db.end();
    }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

testProfileUpdate(); 