const mysql = require('mysql2/promise');
const config = require('./config/config');

async function verifyDatabase() {
    const connection = await mysql.createConnection(config.database);
    try {
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables:', rows);
        const [columns] = await connection.execute('DESCRIBE users');
        console.log('Users columns:', columns);
    } catch (error) {
        console.error('Database verification failed:', error);
    } finally {
        await connection.end();
    }
}

verifyDatabase();