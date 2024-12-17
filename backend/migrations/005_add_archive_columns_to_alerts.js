const db = require('../db/connection');

async function addArchiveColumnsToAlerts() {
    try {
        // Check if columns exist first
        const [columns] = await db.query('SHOW COLUMNS FROM alerts');
        const columnNames = columns.map(col => col.Field);

        // Add is_archived column if it doesn't exist
        if (!columnNames.includes('is_archived')) {
            await db.query('ALTER TABLE alerts ADD COLUMN is_archived BOOLEAN DEFAULT false');
            console.log('Added is_archived column');
        }

        // Add archived_at column if it doesn't exist
        if (!columnNames.includes('archived_at')) {
            await db.query('ALTER TABLE alerts ADD COLUMN archived_at DATETIME DEFAULT NULL');
            console.log('Added archived_at column');
        }

        console.log('Archive columns check completed');
    } catch (error) {
        console.error('Failed to add archive columns to alerts table:', error);
        throw error;
    }
}

module.exports = addArchiveColumnsToAlerts; 