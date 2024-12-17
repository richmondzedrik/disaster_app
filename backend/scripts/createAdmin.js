require('dotenv').config();
const db = require('../db/connection');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    try {
        const hashedPassword = await bcrypt.hash('adminpass123', 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
            ['admin', 'admin@example.com', hashedPassword, 'admin', true]
        );
        
        console.log('Admin user created successfully:', result.insertId);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdminUser(); 