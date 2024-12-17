require('dotenv').config();
const db = require('../db/connection');

async function runMigration() {
    try {
        console.log('Starting migration...');
        
        // First, get existing columns
        const [columns] = await db.query('DESCRIBE users');
        const columnNames = columns.map(col => col.Field);
        console.log('Existing columns:', columnNames);

        // Disable foreign key checks
        await db.query('SET foreign_key_checks = 0');

        // Define columns to add with their specifications
        const columnsToAdd = [
            {
                name: 'verification_code',
                spec: 'VARCHAR(6) NULL'
            },
            {
                name: 'verification_code_expires',
                spec: 'TIMESTAMP NULL'
            },
            {
                name: 'email_verified',
                spec: 'BOOLEAN DEFAULT FALSE'
            }
        ];

        // Add only missing columns
        for (const column of columnsToAdd) {
            if (!columnNames.includes(column.name)) {
                const statement = `ALTER TABLE users ADD COLUMN ${column.name} ${column.spec}`;
                try {
                    await db.query(statement);
                    console.log(`Added column: ${column.name}`);
                } catch (error) {
                    console.error(`Error adding column ${column.name}:`, error);
                }
            } else {
                console.log(`Column ${column.name} already exists, skipping...`);
            }
        }

        // Enable foreign key checks
        await db.query('SET foreign_key_checks = 1');
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration(); 