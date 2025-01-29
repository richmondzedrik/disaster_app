const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../db/connection');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');        
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Configure upload directory
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Admin middleware
const adminMiddleware = async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

// Get all posts
router.get('/api/admin/news/posts', auth.authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author_username,
                u.id as author_id,
                u.avatar_url as author_avatar,
                p.created_at,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_by IS NULL) as comment_count,
                GROUP_CONCAT(DISTINCT l.user_id) as liked_by
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN likes l ON p.id = l.post_id
            GROUP BY p.id, u.username, u.id, u.avatar_url
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            success: true,
            posts: posts.map(post => ({
                ...post,
                created_at: new Date(post.created_at).toISOString()
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

// Update a post
router.put('/posts/:id', auth.authMiddleware, upload.single('media'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        
        // First check if post exists
        const [post] = await db.execute(
            'SELECT * FROM posts WHERE id = ?',
            [id]
        );

        if (!post.length) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        let imageUrl = post[0].image_url;
        
        // Handle new image upload if exists
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            
            const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
                resource_type: 'auto',
                folder: 'disaster-app/news'
            });
            
            imageUrl = cloudinaryResponse.secure_url;
        }

        // Update the post with the new values, keeping existing values if not provided
        const updateTitle = title || post[0].title;
        const updateContent = content || post[0].content;
        const updateImageUrl = imageUrl || post[0].image_url;

        const [result] = await db.execute(
            'UPDATE posts SET title = ?, content = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
            [updateTitle, updateContent, updateImageUrl, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update post'
            });
        }

        // Fetch the updated post to return
        const [updatedPost] = await db.execute(
            'SELECT * FROM posts WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost[0]
        });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update post'
        });
    }
});

// Delete a post
router.delete('/posts/:id', auth.authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        
        // Check if user is admin or post author
        const [posts] = await connection.query(
            'SELECT author_id FROM posts WHERE id = ?',
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const isAuthor = posts[0].author_id === req.user.userId;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this post'
            });
        }

        // Use a transaction for deleting related records
        await connection.beginTransaction();

        try {
            // Delete comments first
            await connection.query(
                'DELETE FROM comments WHERE post_id = ?',
                [id]
            );

            // Then delete likes
            await connection.query(
                'DELETE FROM likes WHERE post_id = ?',
                [id]
            );

            // Finally delete the post
            await connection.query(
                'DELETE FROM posts WHERE id = ?',
                [id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete post'
        });
    } finally {
        connection.release();
    }
});

// Like a post
router.post('/posts/:id/like', auth.authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // First check if the post exists
        const [posts] = await connection.execute(
            'SELECT id, author_id FROM posts WHERE id = ?',
            [req.params.id]
        );

        if (posts.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user already liked the post
        const [existingLike] = await connection.execute(
            'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );

        let liked = false;
        if (existingLike.length > 0) {
            // Unlike the post
            await connection.execute(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [req.params.id, req.user.userId]
            );
        } else {
            // Like the post
            await connection.execute(
                'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
                [req.params.id, req.user.userId]
            );
            liked = true;

            // Create notification for post author if it's not their own post
            if (posts[0].author_id !== req.user.userId) {
                await connection.execute(
                    'INSERT INTO notifications (user_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
                    [
                        posts[0].author_id,
                        'like',
                        req.params.id,
                        `${req.user.username} liked your post`
                    ]
                );
            }
        }

        // Get updated like count
        const [result] = await connection.execute(`
            SELECT COUNT(*) as likes
            FROM likes
            WHERE post_id = ?
        `, [req.params.id]);

        await connection.commit();

        return res.json({
            success: true,
            likes: parseInt(result[0].likes) || 0,
            liked: liked
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error liking post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to like post'
        });
    } finally {
        connection.release();
    }
});

// Get all posts (Admin view)
router.get('/admin/posts', auth.authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [posts] = await db.execute(`
      SELECT 
        p.*,
        u.username as author_username,
        u.id as author_id,
        u.avatar_url as author_avatar,
        p.created_at,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_by IS NULL) as comment_count,
        GROUP_CONCAT(DISTINCT l.user_id) as liked_by
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      GROUP BY p.id, u.username, u.id, u.avatar_url
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      posts: posts.map(post => ({
        ...post,
        created_at: new Date(post.created_at).toISOString(),
        likes: parseInt(post.likes) || 0,
        comment_count: parseInt(post.comment_count) || 0,
        liked_by: post.liked_by ? post.liked_by.split(',').map(id => parseInt(id)) : [],
        author: post.author_username || 'Unknown Author',
        author_username: post.author_username || 'Unknown Author'
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

// Create a new post with image
router.post('/posts', auth.authMiddleware, upload.single('media'), async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        let imageUrl = null;
        
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            
            const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
                resource_type: 'auto',
                folder: 'disaster-app/news'
            });
            
            imageUrl = cloudinaryResponse.secure_url;
        }
        
        // Set status based on user role
        const status = req.user.role === 'admin' ? 'approved' : 'pending';
        
        const [userResult] = await db.execute(
            'SELECT avatar_url FROM users WHERE id = ?',
            [req.user.userId]
        );

        const [result] = await db.execute(
            'INSERT INTO posts (title, content, author_id, status, image_url, author_avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [
                title, 
                content, 
                req.user.userId, 
                status, 
                imageUrl, 
                userResult[0]?.avatar_url || null
            ]
        );

        if (!result.insertId) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create post'
            });
        }

        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        // Send notifications immediately for admin posts
        if (req.user.role === 'admin') {
            try {
                await notificationController.notifyNewPost({
                    body: {
                        postId: result.insertId,
                        title,
                        content,
                        author: req.user.username,
                        status: 'approved',
                        isAdmin: true
                    }
                }, {
                    json: () => {} // Mock response object to prevent double response
                });
            } catch (notifyError) {
                console.error('Notification error:', notifyError);
                // Don't fail the post creation if notification fails
            }
        }

        return res.json({
            success: true,
            message: status === 'approved' ? 'Post created successfully' : 'Post created successfully and pending approval',
            post: posts[0]
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create post'
        });
    }
});


router.post('/posts/:postId/comments', auth.authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }

        // Check if post exists and is approved
        const [postResult] = await db.execute(
            'SELECT status FROM posts WHERE id = ?',
            [postId]
        );

        if (!postResult || postResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (postResult[0].status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Cannot comment on unapproved posts'
            });
        }

        // Check if user exists and is verified
        const [userResult] = await db.execute(
            'SELECT email_verified FROM users WHERE id = ?',
            [userId]
        );

        if (!userResult || userResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (userResult[0].email_verified === 0) {
            return res.status(403).json({
                success: false,
                message: 'Your account needs to be verified to comment'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content.trim()]
        );

        if (result.insertId) {
            const [comments] = await db.execute(
                `SELECT c.*, u.username 
                 FROM comments c 
                 JOIN users u ON c.user_id = u.id 
                 WHERE c.id = ?`,
                [result.insertId]
            );

            const [countResult] = await db.execute(
                'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
                [postId]
            );  

            res.json({ 
                success: true,
                comment: comments[0],
                commentCount: parseInt(countResult[0].count)
            });
        } else {
            throw new Error('Failed to insert comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
});

// Get comments for a specific post
router.get('/posts/:postId/comments', auth.authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;
        const [comments] = await db.execute(`
            SELECT 
                c.id,
                c.content,
                c.user_id,
                c.post_id,
                c.created_at,
                c.deleted_by,
                c.deletion_reason,
                c.deleted_at,
                u.username,
                du.username as deleted_by_username
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users du ON c.deleted_by = du.id
            WHERE c.post_id = ?
            ORDER BY c.created_at DESC
        `, [postId]);
        
        res.json({
            success: true,
            comments: comments.map(comment => ({
                ...comment,
                deleted: !!comment.deleted_by
            }))
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments'
        });
    }
});

// Add this after the GET comments route
router.delete('/comments/:commentId', auth.authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reason } = req.body;
        const isAdmin = req.user.role === 'admin';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete comments'
            });
        }

        // Update the comment instead of deleting it
        const [result] = await db.execute(`
            UPDATE comments 
            SET 
                content = '[Deleted by Admin]',
                deletion_reason = ?,
                deleted_by = ?,
                deleted_at = NOW()
            WHERE id = ?`,
            [reason, req.user.userId, commentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
});

// Delete a comment (admin only)
router.delete('/posts/:postId/comments/:commentId', auth.authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;

        // Update the comment instead of deleting it
        const [result] = await db.execute(`
            UPDATE comments 
            SET 
                content = '[Deleted by Admin]',
                deletion_reason = ?,
                deleted_by = ?,
                deleted_at = NOW()
            WHERE id = ?`,
            [reason, userId, commentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
});

// Get public posts
router.get('/public', async (req, res) => {
    try {
        const userId = req.user?.userId || null;
        const query = `
            SELECT 
                p.*,
                u.username as author,
                u.avatar_url as author_avatar,
                COUNT(DISTINCT l.id) as likes,
                COUNT(DISTINCT c.id) as comment_count,
                ${userId ? 'EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as liked' : 'FALSE as liked'}
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN likes l ON p.id = l.post_id
            LEFT JOIN comments c ON p.id = c.post_id
            WHERE p.status = 'approved'
            GROUP BY p.id, u.username, u.avatar_url
            ORDER BY p.created_at DESC
        `;

        const [posts] = await db.execute(query, userId ? [userId] : []);
        
        res.json({
            success: true,
            posts: posts.map(post => ({
                ...post,
                liked: Boolean(post.liked),
                likes: parseInt(post.likes) || 0
            }))
        });
    } catch (error) {
        console.error('Error fetching public posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch posts'
        });
    }
});

router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'News service is operational' 
  });
});

// Test endpoints for system health check
router.get('/api/news/test', async (req, res) => {
    try {
        // Sample test posts
        const testPosts = [
            {
                id: 1,
                title: 'Test Emergency Update',
                content: 'This is a test emergency update post.',
                status: 'approved',
                author: 'System Test',
                created_at: new Date().toISOString(),
                comment_count: 2,
                like_count: 5
            },
            {
                id: 2,
                title: 'Test Community Alert',
                content: 'This is a test community alert post.',
                status: 'approved',
                author: 'System Test',
                created_at: new Date().toISOString(),
                comment_count: 1,
                like_count: 3
            }
        ];

        res.json({
            success: true,
            message: 'News service is operational',
            posts: testPosts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'News service test failed'
        });
    }
});

router.get('/api/alerts/test', async (req, res) => {
    try {
        // Sample test alerts
        const testAlerts = [
            {
                id: 1,
                type: 'emergency',
                message: 'Test Emergency Alert',
                priority: 2,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                type: 'warning',
                message: 'Test Warning Alert',
                priority: 1,
                is_active: true,
                created_at: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            message: 'Alerts service is operational',
            alerts: testAlerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Alerts service test failed'
        });
    }
});

// Add verification code route
router.post('/auth/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and verification code are required'
            });
        }

        const result = await User.verifyCode(email, code);
        return res.json(result);
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        });   
    }
});

router.get('/api/checklist/test', async (req, res) => {
    try {
        // Sample test checklist items
        const testItems = [
            {
                id: 1,
                title: 'Emergency Kit',
                description: 'Test emergency kit item',
                status: 'pending',
                category: 'Supplies',
                completed: false
            },
            {
                id: 2,
                title: 'Evacuation Plan',
                description: 'Test evacuation plan item',
                status: 'completed',
                category: 'Planning',
                completed: true
            }
        ];

        res.json({
            success: true,
            message: 'Checklist service is operational',
            items: testItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Checklist service test failed'
        });
    }
});

// Add this route after your existing routes
router.post('/test-upload', auth.authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    
    // Test upload to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'disaster-app/test'
    });
    
    res.json({
      success: true,
      url: cloudinaryResponse.secure_url,
      details: cloudinaryResponse
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload test failed',
      error: error
    });
  }
});

router.post('/notify-subscribers', auth.authMiddleware, notificationController.notifyNewPost);

// Get user's liked posts
router.get('/posts/liked', auth.authMiddleware, async (req, res) => {
    try {
        const [likes] = await db.execute(`
            SELECT post_id 
            FROM likes 
            WHERE user_id = ?
        `, [req.user.userId]);

        res.json({
            success: true,
            likedPosts: likes.map(like => like.post_id)
        });
    } catch (error) {
        console.error('Error fetching liked posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch liked posts'
        });
    }
});

module.exports = router;