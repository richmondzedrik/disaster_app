const db = require('../db/connection');

async function addImageUrlToPosts() {
    try {
        // Check if column exists first
        const [columns] = await db.query('SHOW COLUMNS FROM disaster_prep.posts');
        const columnNames = columns.map(col => col.Field);

        // Add image_url column if it doesn't exist
        if (!columnNames.includes('image_url')) {
            await db.query(`
                ALTER TABLE disaster_prep.posts 
                ADD COLUMN image_url VARCHAR(255) DEFAULT NULL
            `);
            console.log('Added image_url column to posts table');
        }

        console.log('Image_url column check completed');
    } catch (error) {
        console.error('Failed to add image_url column to posts table:', error);
        throw error;
    }
}

module.exports = addImageUrlToPosts;