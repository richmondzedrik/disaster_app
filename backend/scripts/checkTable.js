const db = require('../db/connection');

async function checkTable(tableName) {
    try {
        const [tables] = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'disaster_prep' 
            AND TABLE_NAME = ?
        `, [tableName]);
        
        if (tables.length > 0) {
            console.log(`Table ${tableName} exists`);
        } else {
            console.log(`Table ${tableName} does not exist`);
        }
    } catch (error) {
        console.error('Error checking table:', error);
    } finally {
        await db.end();
    }
}

checkTable('likes');