const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');
const db = require('../../db/connection');
const axios = require('axios');

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
                u.id as author_id,
                DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_by IS NULL) as comment_count
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            success: true,
            posts: posts.map(post => ({
                ...post,
                created_at: new Date(post.created_at).toISOString(),
                author_username: post.author || 'Unknown Author',
                comment_count: parseInt(post.comment_count) || 0
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
        // First get the post details
        const [post] = await db.execute(
            `SELECT p.*, u.username as author, u.role as author_role 
             FROM posts p 
             JOIN users u ON p.author_id = u.id 
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!post[0]) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Update post status
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

        // Send notifications only if the post author is not an admin
        if (post[0].author_role !== 'admin') {
            try {
                const notificationData = {
                    postId: post[0].id,
                    title: post[0].title,
                    content: post[0].content,
                    author: post[0].author,
                    status: 'approved',
                    isAdmin: false
                };

                // Make request to notification endpoint
                const apiUrl = process.env.API_URL || 'https://disaster-app-backend.onrender.com';
                const notifyResponse = await axios.post(
                    `${apiUrl}/api/news/notify-subscribers`,
                    notificationData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': req.headers.authorization
                        }
                    }
                );

                console.log('Notification response:', notifyResponse.data);
            } catch (notifyError) {
                console.error('Error sending notifications:', notifyError);
                // Don't fail the approval if notifications fail
            }
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
    const connection = await db.getConnection();
    try {
        // Start transaction
        await connection.beginTransaction();

        // First, delete associated records using the connection
        await connection.query('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
        await connection.query('DELETE FROM likes WHERE post_id = ?', [req.params.id]);
        
        // Then delete the post using the connection
        const [result] = await connection.query('DELETE FROM posts WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Commit the transaction
        await connection.commit();

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete post'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;