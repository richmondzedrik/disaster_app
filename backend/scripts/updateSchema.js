require('dotenv').config();
const db = require('../db/connection');

async function updateSchema() {
    try {
        // Add refresh_token column if it doesn't exist
        await db.execute(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255)
        `);
        
        console.log('Schema updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema(); 