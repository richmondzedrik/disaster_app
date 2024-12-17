const db = require('../db/connection');

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

            const [result] = await db.execute(
                'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
                [postId, userId, content]
            );

            if (result.insertId) {
                const [comments] = await db.execute(
                    `SELECT c.*, u.username 
                     FROM comments c 
                     JOIN users u ON c.user_id = u.id 
                     WHERE c.id = ?`,
                    [result.insertId]
                );

                res.json({
                    success: true,
                    comment: comments[0]
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