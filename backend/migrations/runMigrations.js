const mysql = require('mysql2/promise');
const config = require('../config/database');
const initDatabase = require('./000_init_database');
const createActivityLogs = require('./001_create_activity_logs');
const createChecklistTable = require('./002_create_checklist_table');
const createChecklistItemsTable = require('./003_create_checklist_items_table');
const createAlertsTable = require('./004_create_alerts_table');
const addArchiveColumnsToAlerts = require('./005_add_archive_columns_to_alerts');
const addCreatedByToAlerts = require('./006_add_created_by_to_alerts');
const addProfileFields = require('./007_add_profile_fields');
const addLocationAndEmergencyContacts = require('./008_add_location_emergency_contacts');
const createCommentsTable = require('./009_create_comments_table');
const createLikesTable = require('./010_create_likes_table');

async function runMigrations() {
    const connection = await mysql.createConnection({
        ...config,
        ssl: false // Disable SSL for initial database creation
    });

    try {
        console.log('Starting migrations...');
        
        // Run migrations in sequence
        await initDatabase.up();
        await createActivityLogs.up();
        await createChecklistTable();
        await createChecklistItemsTable();
        await createAlertsTable();
        await addArchiveColumnsToAlerts();
        await addCreatedByToAlerts();
        await addProfileFields();
        await addLocationAndEmergencyContacts();
        await createCommentsTable();
        await createLikesTable();

        console.log('All migrations completed successfully');
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    } finally {
        await connection.end();
    }
}

module.exports = runMigrations;