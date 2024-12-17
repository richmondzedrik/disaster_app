require('dotenv').config();
const db = require('../db/connection');

async function updateVerificationSchema() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // First, get existing columns
        const [columns] = await connection.execute('DESCRIBE users');
        const columnNames = columns.map(col => col.Field);

        // Disable foreign key checks
        await connection.execute('SET foreign_key_checks = 0');

        // Drop old columns if they exist
        const dropColumns = ['verification_token', 'verification_expires'];
        for (const column of dropColumns) {
            if (columnNames.includes(column)) {
                await connection.execute(`ALTER TABLE users DROP COLUMN ${column}`);
                console.log(`Dropped column: ${column}`);
            }
        }

        // Add or modify verification_code column
        if (!columnNames.includes('verification_code')) {
            await connection.execute('ALTER TABLE users ADD COLUMN verification_code VARCHAR(6)');
            console.log('Added verification_code column');
        }

        // Add or modify verification_expires column
        if (!columnNames.includes('verification_expires')) {
            await connection.execute('ALTER TABLE users ADD COLUMN verification_expires DATETIME');
            console.log('Added verification_expires column');
        }

        // Add or modify email_verified column
        if (!columnNames.includes('email_verified')) {
            await connection.execute('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE');
            console.log('Added email_verified column');
        }

        // Re-enable foreign key checks
        await connection.execute('SET foreign_key_checks = 1');

        await connection.commit();
        console.log('Verification schema updated successfully');
    } catch (error) {
        await connection.rollback();
        console.error('Schema update failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Run the migration
updateVerificationSchema()
    .then(() => {
        console.log('Schema update completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Schema update failed:', error);
        process.exit(1);
    }); 