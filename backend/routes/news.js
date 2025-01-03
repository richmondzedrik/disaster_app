const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

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
router.get('/posts', auth.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author,
                u.id as authorId,
                p.created_at as createdAt,
                (SELECT COUNT(*) FROM disaster_prep.likes WHERE post_id = p.id) as likes,
                (SELECT COUNT(*) FROM disaster_prep.comments WHERE post_id = p.id) as commentCount,
                EXISTS(SELECT 1 FROM disaster_prep.likes WHERE post_id = p.id AND user_id = ?) as liked
            FROM disaster_prep.posts p
            JOIN disaster_prep.users u ON p.author_id = u.id
            WHERE p.status = 'approved'
            ORDER BY p.created_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            posts: posts.map(post => ({
                ...post,
                likes: parseInt(post.likes) || 0,
                commentCount: parseInt(post.commentCount) || 0,
                liked: Boolean(post.liked)
            }))
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch posts'
        });
    }
});

// Update a post
router.put('/posts/:id', auth.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        
        const [result] = await db.execute(
            'UPDATE disaster_prep.posts SET title = ?, content = ? WHERE id = ? AND author_id = ?',
            [title, content, id, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Post updated successfully'
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
    try {
        const { id } = req.params;
        
        // Check if user is admin or post author
        const [posts] = await db.execute(
            'SELECT author_id FROM disaster_prep.posts WHERE id = ?',
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

        const [result] = await db.execute(
            'DELETE FROM disaster_prep.posts WHERE id = ?',
            [id]
        );

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

// Like a post
router.post('/posts/:id/like', auth.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // First check if the post exists
        const [posts] = await db.execute(
            'SELECT id FROM disaster_prep.posts WHERE id = ?',
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user already liked the post
        const [existingLike] = await db.execute(
            'SELECT id FROM disaster_prep.likes WHERE post_id = ? AND user_id = ?',
            [id, userId]
        );

        let liked = false;
        if (existingLike.length > 0) {
            // Unlike the post
            await db.execute(
                'DELETE FROM disaster_prep.likes WHERE post_id = ? AND user_id = ?',
                [id, userId]
            );
        } else {
            // Like the post
            await db.execute(
                'INSERT INTO disaster_prep.likes (post_id, user_id) VALUES (?, ?)',
                [id, userId]
            );
            liked = true;
        }

        // Get updated like count
        const [result] = await db.execute(`
            SELECT COUNT(*) as likes
            FROM disaster_prep.likes
            WHERE post_id = ?
        `, [id]);

        return res.json({
            success: true,
            likes: parseInt(result[0].likes) || 0,
            liked: liked
        });
    } catch (error) {
        console.error('Error liking post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to like post'
        });
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
        p.created_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
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

// Create a new post with image
router.post('/posts', auth.authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Store only the filename
        const imagePath = req.file ? req.file.filename : null;
        
        const [result] = await db.execute(
            'INSERT INTO disaster_prep.posts (title, content, author_id, status, image_url) VALUES (?, ?, ?, ?, ?)',
            [title, content, req.user.userId, 'pending', imagePath]
        );

        if (!result.insertId) {
            throw new Error('Failed to create post');
        }

        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author
            FROM disaster_prep.posts p
            JOIN disaster_prep.users u ON p.author_id = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        res.json({
            success: true,
            message: 'Post created successfully and pending approval',
            post: posts[0]
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create post'
        });
    }
});


router.post('/posts/:postId/comments', auth.authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const [result] = await db.execute(
            'INSERT INTO disaster_prep.comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );

        if (result.insertId) {
            const [comments] = await db.execute(
                `SELECT c.*, u.username 
                 FROM disaster_prep.comments c 
                 JOIN disaster_prep.users u ON c.user_id = u.id 
                 WHERE c.id = ?`,
                [result.insertId]
            );

            // Get updated comment count
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as count FROM disaster_prep.comments WHERE post_id = ?',
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
            FROM disaster_prep.comments c
            LEFT JOIN disaster_prep.users u ON c.user_id = u.id
            LEFT JOIN disaster_prep.users du ON c.deleted_by = du.id
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
            UPDATE disaster_prep.comments 
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
            UPDATE disaster_prep.comments 
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

// Get public posts (no auth required)
router.get('/public', async (req, res) => {
    try {
        // Get userId from auth token if available
        const userId = req.headers.authorization ? 
            (await auth.getUserFromToken(req.headers.authorization))?.userId : 
            null;

        const [posts] = await db.execute(`
            SELECT 
                p.*,
                u.username as author,
                (SELECT COUNT(*) FROM disaster_prep.likes WHERE post_id = p.id) as likes,
                (SELECT COUNT(*) FROM disaster_prep.comments WHERE post_id = p.id) as comment_count,
                ${userId ? `(SELECT COUNT(*) > 0 FROM disaster_prep.likes WHERE post_id = p.id AND user_id = ?) as liked` : 'FALSE as liked'}
            FROM disaster_prep.posts p
            LEFT JOIN disaster_prep.users u ON p.author_id = u.id
            WHERE p.status = 'approved'
            ORDER BY p.created_at DESC
        `, userId ? [userId] : []);
        
        return res.json({
            success: true,
            posts: posts.map(post => ({
                ...post,
                likes: parseInt(post.likes) || 0,
                comment_count: parseInt(post.comment_count) || 0,
                liked: Boolean(post.liked)
            }))
        });
    } catch (error) {
        console.error('Error fetching public posts:', error);
        return res.status(500).json({
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

module.exports = router;