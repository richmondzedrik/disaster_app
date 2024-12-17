const db = require('../db/connection');

async function addLocationAndEmergencyContacts() {
    try {
        await db.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS emergency_contacts JSON NULL DEFAULT ('[]')
        `);
        console.log('Added location and emergency contacts fields successfully');
    } catch (error) {
        console.error('Failed to add location and emergency contacts fields:', error);
        throw error;
    }
}

module.exports = addLocationAndEmergencyContacts; 