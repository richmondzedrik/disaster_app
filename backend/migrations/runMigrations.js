const createPostsTable = require('./007_create_posts_table');
const addImageUrlToPosts = require('./008_add_image_url_to_posts');
const createCommentsTable = require('./009_create_comments_table');
const createLikesTable = require('./010_create_likes_table');
const db = require('../db/connection');

async function runMigrations() {
    try {
        await createPostsTable();
        await addImageUrlToPosts();
        await createCommentsTable();
        await createLikesTable();
        
        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

runMigrations();