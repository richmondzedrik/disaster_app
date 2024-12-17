const db = require('../db/connection');

async function createChecklistItemsTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_item_id (user_id, item_id)
      )
    `);
    console.log('Checklist items table created successfully');
  } catch (error) {
    console.error('Failed to create checklist items table:', error);
    throw error;
  }
}

module.exports = createChecklistItemsTable; 