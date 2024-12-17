const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');
const db = require('../../db/connection');

// Apply middleware to all routes
router.use(auth.authMiddleware);
router.use(adminMiddleware);

// Get all posts (Admin view)
router.get('/posts', async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author,
                u.id as authorId,
                p.created_at as createdAt
            FROM disaster_prep.posts p
            JOIN disaster_prep.users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            success: true,
            posts: posts.map(post => ({
                ...post,
                createdAt: new Date(post.created_at).toISOString()
            }))
        });
    } catch (error) {
        console.error('Error fetching admin posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch posts'
        });
    }
});

// Approve post
router.put('/posts/:id/approve', async (req, res) => {
    try {
        const [result] = await db.execute(
            'UPDATE posts SET status = "approved" WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.json({
            success: true,
            message: 'Post approved successfully'
        });
    } catch (error) {
        console.error('Error approving post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve post'
        });
    }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM posts WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete post'
        });
    }
});

module.exports = router;