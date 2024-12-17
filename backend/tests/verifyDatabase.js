const db = require('../db/connection');

async function verifyDatabase() {
    try {
        // Test connection
        const connection = await db.getConnection();
        console.log('Database connection successful');

        // Check users table structure
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users
        `);
        console.log('\nUsers table structure:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Verify specific columns exist
        const requiredColumns = [
            'id', 'username', 'email', 'password', 'role',
            'location', 'phone', 'notifications', 'emergency_contacts'
        ];

        const missingColumns = requiredColumns.filter(
            required => !columns.find(col => col.Field === required)
        );

        if (missingColumns.length > 0) {
            console.error('\nMissing required columns:', missingColumns);
        } else {
            console.log('\nAll required columns exist');
        }

        connection.release();
    } catch (error) {
        console.error('Database verification failed:', error);
    } finally {
        await db.end();
    }
}

verifyDatabase(); 