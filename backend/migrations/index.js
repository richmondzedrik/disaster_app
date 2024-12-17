const db = require('../db/connection');
const createActivityLogs = require('./001_create_activity_logs');
const addImageUrlToPosts = require('./008_add_image_url_to_posts');
const createCommentsTable = require('./009_create_comments_table');
const createLikesTable = require('./010_create_likes_table');

async function runMigrations() {
    try {
        await createActivityLogs.up();
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