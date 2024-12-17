const db = require('../db/connection');

async function createLikesTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS disaster_prep.likes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES disaster_prep.posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES disaster_prep.users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (post_id, user_id)
            )
        `);
        console.log('Likes table created successfully');
    } catch (error) {
        console.error('Failed to create likes table:', error);
        throw error;
    }
}

module.exports = createLikesTable;