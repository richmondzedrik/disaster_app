const db = require('../db/connection');

async function addProfileFields() {
    try {
        await db.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL,
            ADD COLUMN IF NOT EXISTS notifications JSON NULL
        `);
        console.log('Added profile fields successfully');
    } catch (error) {
        console.error('Failed to add profile fields:', error);
        throw error;
    }
}

module.exports = addProfileFields; 