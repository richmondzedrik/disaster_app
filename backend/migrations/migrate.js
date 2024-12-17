const db = require('../db/connection');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        await db.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS emergency_contacts JSON NULL DEFAULT ('[]')
        `);
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

migrate(); 