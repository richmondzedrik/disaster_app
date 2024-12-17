const initDatabase = require('../../migrations/000_init_database');

async function runMigration() {
    try {
        await initDatabase.up();
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();