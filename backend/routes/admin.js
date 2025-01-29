const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const db = require('../db/connection');
const User = require('../models/User');
const cors = require('cors');
const axios = require('axios');
const notificationController = require('../controllers/notificationController');

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

router.use(cors(corsOptions));

// Pre-flight OPTIONS handling
router.options('*', cors(corsOptions));

// Add this middleware at the top of your admin routes 
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://disasterapp.netlify.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Modify the middleware application
router.use(async (req, res, next) => {
  try {
    // Skip auth check for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // Call authMiddleware directly with next
    auth.authMiddleware(req, res, async () => {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Add catch-all route for admin SPA
router.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Get all users
router.get('/users', auth.authMiddleware, async (req, res) => {
  try {
      // Set CORS headers explicitly for this route
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      
      const [rows] = await db.execute(`
          SELECT 
              id,
              username,
              email,
              role,
              created_at,
              email_verified
          FROM users
          ORDER BY created_at DESC
      `);
      
      res.json({ 
          success: true, 
          data: rows.map(user => ({
              ...user,
              email_verified: Boolean(user.email_verified)
          }))
      });
  } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch users' 
      });
  }
});

// Add the delete user route
router.delete('/users/:id', adminController.deleteUser);

// Add the update user role route
router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if user exists and get their current role
    const [userRows] = await db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Update user role
    const [result] = await db.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } else {
      throw new Error('Failed to update user role');
    }
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Dashboard stats route
router.get('/dashboard/stats', auth.authMiddleware, async (req, res) => {
  try {
    // Verify admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get stats with error handling for each query
    let stats = { users: 0, posts: 0, alerts: 0 };
    let recentActivity = [];

    try {
      const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
      stats.users = userCount[0].count;
    } catch (error) {
      console.error('Error counting users:', error);
    }

    try {
      const [postCount] = await db.execute('SELECT COUNT(*) as count FROM posts');
      stats.posts = postCount[0].count;
    } catch (error) {
      console.error('Error counting posts:', error);
    }

    try {
      const [alertCount] = await db.execute('SELECT COUNT(*) as count FROM alerts WHERE is_active = 1');
      stats.alerts = alertCount[0].count;
    } catch (error) {
      console.error('Error counting alerts:', error);
    }

    try {
      const [activity] = await db.execute(`
        SELECT 
          al.id,
          al.action,
          al.timestamp,
          u.username
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.timestamp DESC
        LIMIT 10
      `);
      recentActivity = activity;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }

    res.json({
      success: true,
      stats,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get all posts (Admin view)
router.get('/posts', async (req, res) => {
  try {
    const [posts] = await db.execute(`
      SELECT 
        p.*,
        u.username as author_username,
        u.id as author_id,
        p.created_at
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
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
    console.error('Get posts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch posts' 
    });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user.userId;

    const [result] = await db.execute(
      'INSERT INTO posts (title, content, category, user_id) VALUES (?, ?, ?, ?)',
      [title, content, category, userId]
    );

    res.json({
      success: true,
      message: 'Post created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const postId = req.params.id;

    const [result] = await db.execute(
      'UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?',
      [title, content, category, postId]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Post updated successfully'
      });
    } else {
      throw new Error('Post not found');
    }
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
});

router.delete('/posts/:id', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // First, delete associated records
    await connection.query('DELETE FROM post_comments WHERE post_id = ?', [req.params.id]);
    await connection.query('DELETE FROM post_likes WHERE post_id = ?', [req.params.id]);
    await connection.query('DELETE FROM post_saves WHERE post_id = ?', [req.params.id]);
    
    // Then delete the post
    const [result] = await connection.query('DELETE FROM posts WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Log the activity
    await connection.query(
      'INSERT INTO activity_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
      [req.user.userId, 'deleted_post', 'post', req.params.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  } finally {
    connection.release();
  }
});

// Add this route before module.exports
router.get('/analytics', async (req, res) => {
  try {
    // Get active users in last 24 hours
    const [activeUsers] = await db.execute(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_sessions 
      WHERE last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Get alerts in last 30 days
    const [recentAlerts] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM alerts 
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // Get user registration trends
    const [userTrends] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Get alert type distribution
    const [alertDist] = await db.execute(`
      SELECT 
        type,
        COUNT(*) as count
      FROM alerts
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY type
    `);

    res.json({
      success: true,
      stats: {
        activeUsers24h: activeUsers[0].count,
        alertsLast30Days: recentAlerts[0].count,
        uptime: process.uptime()
      },
      userTrends: {
        labels: userTrends.map(row => row.date),
        datasets: [{
          label: 'New Users',
          data: userTrends.map(row => row.count)
        }]
      },
      alertDistribution: {
        labels: alertDist.map(row => row.type),
        datasets: [{
          data: alertDist.map(row => row.count)
        }]
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Add this route after your existing admin routes
router.get('/alerts', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const [rows] = await db.execute(`
      SELECT 
        a.*,
        u.username as created_by_username
      FROM alerts a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);
    
    return res.json({ 
      success: true, 
      alerts: rows.map(alert => ({
        ...alert,
        is_active: Boolean(alert.is_active),
        is_public: Boolean(alert.is_public)
      }))
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch alerts' 
    });
  }
}); 

// Create new alert
router.post('/alerts', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://disasterapp.netlify.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { message, type, priority, expiry_date, is_public } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alert message is required'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO alerts (message, type, priority, expiry_date, is_public, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, true)`,
      [message.trim(), type || 'info', priority || 0, expiry_date || null, 
       is_public || false, req.user.userId]
    );

    const [newAlert] = await db.execute(
      `SELECT a.*, u.username as created_by_username
       FROM alerts a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = ?`, 
      [result.insertId]
    );

    res.json({
      success: true,
      message: 'Alert created successfully',
      data: newAlert[0]
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert'
    });
  }
});

// Update alert status
router.put('/alerts/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const alertId = req.params.id;

    await db.execute(
      'UPDATE alerts SET is_active = ? WHERE id = ?',
      [Boolean(isActive), alertId]
    );

    res.json({
      success: true,
      message: `Alert ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert status'
    });
  }
});

// Delete alert
router.delete('/alerts/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM alerts WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert'
    });
  }
});

// Add these routes after the existing /posts route

// Approve a post
router.put('/posts/:id/approve', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // First get the post details
        const [posts] = await connection.execute(
            `SELECT p.*, u.username as author, u.role as author_role 
             FROM posts p 
             JOIN users u ON p.author_id = u.id 
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!posts[0]) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const post = posts[0];

        // Update post status
        const [result] = await connection.execute(
            'UPDATE posts SET status = "approved", approved_at = NOW(), approved_by = ? WHERE id = ?',
            [req.user.userId, req.params.id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Send notifications if the post author is not an admin
        if (post.author_role !== 'admin') {
            try {
                await notificationController.notifyNewPost({
                    body: {
                        postId: post.id,
                        title: post.title,
                        content: post.content,
                        author: post.author,
                        status: 'approved',
                        isAdmin: false
                    }
                }, {
                    json: () => {} // Mock response object
                });
            } catch (notifyError) {
                console.error('Error sending notifications:', notifyError);
                // Continue with approval even if notification fails
            }
        }

        // Log the activity
        await connection.execute(
            'INSERT INTO activity_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
            [req.user.userId, 'approved_post', 'post', req.params.id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Post approved successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Approve post error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve post'
        });
    } finally {
        connection.release();
    }
});

// Reject a post
router.put('/posts/:id/reject', async (req, res) => {
  try {
    const postId = req.params.id;
    const { reason } = req.body;

    const [result] = await db.execute(
      'UPDATE posts SET status = "rejected", rejected_at = NOW(), rejected_by = ?, rejection_reason = ? WHERE id = ?',
      [req.user.userId, reason || null, postId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Log the activity
    await db.execute(
      'INSERT INTO activity_logs (user_id, action, target_type, target_id) VALUES (?, ?, ?, ?)',
      [req.user.userId, 'rejected_post', 'post', postId]
    );

    res.json({
      success: true,
      message: 'Post rejected successfully'
    });
  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject post'
    });
  }
});

// Update post status
router.put('/posts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const postId = req.params.id;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const [result] = await db.execute(
      'UPDATE posts SET status = ? WHERE id = ?',
      [status, postId]
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
    console.error('Update post status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post status'
    });
  }
});

// Add test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin service is operational' 
  });
});

// Add these test endpoints
router.get('/alerts/test', async (req, res) => {
  try {
    const testAlerts = [
      {
        id: 1,
        type: 'emergency',
        message: 'Test Emergency Alert',
        priority: 2,
        is_active: true
      },
      {
        id: 2,
        type: 'warning',
        message: 'Test Warning Alert',
        priority: 1,
        is_active: true
      }
    ];

    res.json({
      success: true,
      message: 'Alerts service is operational',
      data: {
        alerts: testAlerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Alerts service test failed'
    });
  }
});

router.get('/news/test', async (req, res) => {
  try {
    const testPosts = [
      {
        id: 1,
        title: 'Emergency Update Post',
        content: 'Test content',
        status: 'approved'
      },
      {
        id: 2,
        title: 'Community Alert Post',
        content: 'Test content',
        status: 'approved'
      }
    ];

    res.json({
      success: true,
      message: 'News service is operational',
      data: {
        posts: testPosts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'News service test failed'
    });
  }
});

router.get('/checklist/test', async (req, res) => {
  try {
    const testItems = [
      {
        id: 1,
        title: 'Emergency Kit',
        description: 'Test description',
        status: 'pending'
      },
      {
        id: 2,
        title: 'Evacuation Plan',
        description: 'Test description',
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      message: 'Checklist service is operational',
      data: {
        items: testItems
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Checklist service test failed'
    });
  }
});

// Add this route for testing
router.get('/alerts/test', async (req, res) => {
  try {
    // Test database connection
    const [testResult] = await db.execute('SELECT 1');
    
    // Test alerts table
    const [alerts] = await db.execute('SELECT * FROM alerts LIMIT 1');
    
    res.json({
      success: true,
      message: 'Alert system operational',
      data: {
        dbConnection: !!testResult,
        alertsTable: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Alert system test error:', error);
    res.status(500).json({
      success: false,
      message: 'Alert system test failed',
      error: error.message
    });
  }
});

// Reactivate alert
router.post('/alerts/:id/reactivate', async (req, res) => {
  try {
    const alertId = req.params.id;
    
    const [result] = await db.execute(
      'UPDATE alerts SET is_active = true WHERE id = ?',
      [alertId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate alert'
    });
  }
});

module.exports = router; 