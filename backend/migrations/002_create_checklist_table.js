const db = require('../db/connection');

async function createChecklistTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS checklist_progress (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_item (user_id, item_id)
      )
    `);
    console.log('Checklist table created successfully');
  } catch (error) {
    console.error('Failed to create checklist table:', error);
    throw error;
  }
}

module.exports = createChecklistTable; 