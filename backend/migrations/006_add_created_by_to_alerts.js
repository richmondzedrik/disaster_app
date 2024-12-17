const db = require('../db/connection');

async function addCreatedByToAlerts() {
    try {
        // Check if column exists first
        const [columns] = await db.query('SHOW COLUMNS FROM alerts');
        const columnNames = columns.map(col => col.Field);

        // Add created_by column if it doesn't exist
        if (!columnNames.includes('created_by')) {
            await db.query(`
                ALTER TABLE alerts 
                ADD COLUMN created_by INT,
                ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            `);
            console.log('Added created_by column to alerts table');
        }

        console.log('Created_by column check completed');
    } catch (error) {
        console.error('Failed to add created_by column to alerts table:', error);
        throw error;
    }
}

module.exports = addCreatedByToAlerts; 