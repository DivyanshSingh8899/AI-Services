const express = require('express');
const { logActivity, getStats, getRecentActivities } = require('../services/analyticsService');

const router = express.Router();

// @route   POST /api/analytics/activity
// @desc    Log an activity event
// @access  Public
router.post('/activity', async (req, res) => {
  try {
    const { event, payload } = req.body;

    if (!event) {
      return res.status(400).json({ error: true, message: 'Event name is required' });
    }

    await logActivity(event, payload || {});

    res.status(201).json({ error: false, message: 'Activity logged' });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: true, message: 'Failed to log activity' });
  }
});

// @route   GET /api/analytics/stats
// @desc    Get global analytics stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ error: false, data: stats });
  } catch (error) {
    console.error('Get analytics stats error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch analytics stats' });
  }
});

// @route   GET /api/analytics/recent
// @desc    Get recent activities
// @access  Private
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const activities = await getRecentActivities(parseInt(limit));
    res.json({ error: false, data: activities });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch recent activities' });
  }
});

module.exports = router;
