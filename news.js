const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const db = require('../../db/connection');
const adminMiddleware = require('../../middleware/admin');

// Get all posts (Admin view)
router.get('/posts', auth.authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author
            FROM disaster_prep.posts p
            JOIN disaster_prep.users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            success: true,
            posts
        });
    } catch (error) {
        console.error('Error fetching admin posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch posts'
        });
    }
});

// Update post status (Admin only)
router.put('/admin/news/posts/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const [result] = await db.execute(
            'UPDATE disaster_prep.posts SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.json({
            success: true,
            message: 'Post status updated successfully'
        });
    } catch (error) {
        console.error('Error updating post status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update post status'
        });
    }
});

module.exports = router;