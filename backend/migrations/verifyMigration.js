const db = require('../db/connection');

async function verifyMigration() {
    try {
        console.log('Verifying migration...');
        
        const [columns] = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('location', 'emergency_contacts')
        `);
        
        if (columns.length === 2) {
            console.log('Migration verified successfully:');
            columns.forEach(col => {
                console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
            });
        } else {
            console.error('Migration verification failed. Missing columns:', 
                ['location', 'emergency_contacts'].filter(col => 
                    !columns.find(c => c.COLUMN_NAME === col)
                )
            );
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

verifyMigration(); 