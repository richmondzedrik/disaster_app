const db = require('../db/connection');

async function createPostsTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS disaster_prep.posts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                author_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                likes INT DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                image_url VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                CHECK (status IN ('pending', 'approved', 'rejected'))
            )
        `);
        console.log('Posts table created successfully');
    } catch (error) {
        console.error('Failed to create posts table:', error);
        throw error;
    }
}

module.exports = createPostsTable;
