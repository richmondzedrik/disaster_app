const { db } = require('../db/supabase-connection-cjs');

const commentController = {
    async getComments(req, res) {
        try {
            const postId = req.params.postId;
            const [comments] = await db.execute(
                'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC',
                [postId]
            );
            
            res.json({
                success: true,
                comments
            });
        } catch (error) {
            console.error('Error fetching comments:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please login again.'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to fetch comments'
            });
        }
    },

    async addComment(req, res) {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const userId = req.user.userId;

            if (!req.user.isVerified) {
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
    }
};

module.exports = commentController;