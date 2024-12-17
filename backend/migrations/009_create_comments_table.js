const db = require('../db/connection');

async function createCommentsTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS disaster_prep.comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Comments table created successfully');
    } catch (error) {
        console.error('Failed to create comments table:', error);
        throw error;
    }
}

module.exports = createCommentsTable;
