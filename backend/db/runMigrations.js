const db = require('./connection');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    try {
        // Create migrations table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get all SQL files from migrations directory
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql'));

        // Get executed migrations
        const [executed] = await db.query('SELECT name FROM migrations');
        const executedMigrations = executed.map(row => row.name);

        // Run pending migrations
        for (const file of sqlFiles) {
            if (!executedMigrations.includes(file)) {
                console.log(`Running migration: ${file}`);
                const sqlContent = await fs.readFile(
                    path.join(migrationsDir, file), 
                    'utf8'
                );

                // Split SQL content into separate statements
                const statements = sqlContent
                    .split(';')
                    .filter(stmt => stmt.trim());

                // Execute each statement
                for (const statement of statements) {
                    if (statement.trim()) {
                        await db.query(statement);
                    }
                }

                // Record migration
                await db.query(
                    'INSERT INTO migrations (name) VALUES (?)',
                    [file]
                );
                console.log(`Completed migration: ${file}`);
            }
        }

        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => console.log('Migration process completed'))
        .catch(error => {
            console.error('Migration process failed:', error);
            process.exit(1);
        });
}

module.exports = runMigrations; 