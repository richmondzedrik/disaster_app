const db = require('../db/connection');

async function createAlertsTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        priority INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expiry_date TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Alerts table created successfully');
  } catch (error) {
    console.error('Failed to create alerts table:', error);
    throw error;
  }
}

module.exports = createAlertsTable; 