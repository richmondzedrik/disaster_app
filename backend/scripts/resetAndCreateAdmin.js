require('dotenv').config();
const db = require('../db/connection');
const bcrypt = require('bcryptjs');

async function resetAndCreateAdmin() {
    try {
        // First, clear all users
        console.log('Clearing all users...');
        await db.execute('DELETE FROM users');
        
        // Then create admin user
        console.log('Creating new admin user...');
        const hashedPassword = await bcrypt.hash('adminpass123', 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
            ['admin', 'admin@example.com', hashedPassword, 'admin', true]
        );
        
        console.log('Admin user created successfully:', result.insertId);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAndCreateAdmin(); 