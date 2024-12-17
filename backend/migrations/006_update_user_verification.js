const db = require('../db/connection');

async function updateUserVerification() {
    try {
        await db.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6) NULL,
            ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
            DROP COLUMN IF EXISTS verification_token
        `);
        console.log('Updated user verification columns successfully');
    } catch (error) {
        console.error('Failed to update user verification columns:', error);
        throw error;
    }
}

module.exports = updateUserVerification; 