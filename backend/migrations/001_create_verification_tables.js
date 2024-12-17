const db = require('../db/connection');

async function createVerificationTables() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Create verification_attempts table to track attempts
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS verification_attempts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                attempts INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Modify users table
        await connection.execute(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6) NULL,
            ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMP NULL
        `);

        await connection.commit();
        console.log('Verification tables created successfully');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = createVerificationTables; 