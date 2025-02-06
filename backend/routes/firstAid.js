const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/connection');

router.put('/update-video', auth.authMiddleware, async (req, res) => {
    try {
        const { guideIndex, videoUrl } = req.body;

        // Validate URL format
        const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!urlPattern.test(videoUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid YouTube URL'
            });
        }

        // Update video URL in database
        const [result] = await db.execute(
            'UPDATE first_aid_guides SET video_url = ? WHERE guide_index = ?',
            [videoUrl, guideIndex]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guide not found'
            });
        }

        res.json({
            success: true,
            message: 'Video URL updated successfully'
        });
    } catch (error) {
        console.error('Update video URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update video URL'
        });
    }
});

module.exports = router;
