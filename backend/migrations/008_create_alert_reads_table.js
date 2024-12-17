const db = require('../db/connection');

async function createAlertReadsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS alert_reads (
                user_id INT NOT NULL,
                alert_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, alert_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
            )
        `);
        console.log('Alert reads table created successfully');
    } catch (error) {
        console.error('Failed to create alert reads table:', error);
        throw error;
    }
}

module.exports = createAlertReadsTable; 