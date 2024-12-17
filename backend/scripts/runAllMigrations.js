const initDatabase = require('./initDatabase');
const createVerificationTables = require('../migrations/001_create_verification_tables');
const createChecklistTable = require('../migrations/002_create_checklist_table');
const createChecklistItemsTable = require('../migrations/003_create_checklist_items_table');
const createAlertsTable = require('../migrations/004_create_alerts_table');

async function runAllMigrations() {
    try {
        console.log('Starting migrations...');
        
        // Initialize database first
        await initDatabase();
        
        // Run migrations in order
        await createVerificationTables();
        console.log('Verification tables migration completed');
        
        await createChecklistTable();
        console.log('Checklist table migration completed');
        
        await createChecklistItemsTable();
        console.log('Checklist items table migration completed');
        
        await createAlertsTable();
        console.log('Alerts table migration completed');
        
        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runAllMigrations(); 