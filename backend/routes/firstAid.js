const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db/connection');

// Add admin check middleware
const checkAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

router.put('/update-video', auth.authMiddleware, checkAdmin, async (req, res) => {
    try {
        const { guideIndex, videoUrl } = req.body;

        // Validate URL format
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
        if (!urlPattern.test(videoUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid video URL'
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

router.get('/guides', auth.authMiddleware, async (req, res) => {
  try {
    const [guides] = await db.execute(
      'SELECT guide_index, video_url FROM first_aid_guides ORDER BY guide_index'
    );

    res.json({
      success: true,
      guides: guides
    });
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guides'
    });
  }
});

module.exports = router;
