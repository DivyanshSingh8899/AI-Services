const express = require('express');
const { body, validationResult } = require('express-validator');
const AIBot = require('../models/AIBot');
const { logActivity } = require('../services/analyticsService');
const { processAIResponse } = require('../services/aiService');

const router = express.Router();

// Validation middleware for AI Bot creation
const validateAIBot = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bot name must be between 2 and 100 characters'),
  body('type')
    .isIn(['customer-support', 'sales', 'appointment', 'general', 'custom'])
    .withMessage('Please select a valid bot type'),
  body('channels')
    .isArray({ min: 1 })
    .withMessage('At least one channel must be selected'),
  body('channels.*')
    .isIn(['whatsapp', 'website', 'email', 'instagram', 'facebook', 'telegram'])
    .withMessage('Invalid channel selected'),
  body('language')
    .optional()
    .isIn(['en', 'hi', 'gu', 'ta', 'te', 'kn', 'ml', 'bn', 'pa'])
    .withMessage('Invalid language selected')
];

// @route   POST /api/ai-bot
// @desc    Create a new AI bot
// @access  Private
router.post('/', validateAIBot, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array()
      });
    }

    // Create new AI bot
    const aiBot = new AIBot({
      ...req.body,
      businessId: req.body.businessId || 'demo-business' // In production, get from auth
    });

    // Save to database
    await aiBot.save();

    // Log activity
    await logActivity('ai_bot_created', {
      botId: aiBot._id,
      botType: aiBot.type,
      channels: aiBot.channels
    });

    res.status(201).json({
      error: false,
      message: 'AI Bot created successfully',
      data: aiBot
    });

  } catch (error) {
    console.error('Create AI bot error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create AI bot'
    });
  }
});

// @route   GET /api/ai-bot
// @desc    Get all AI bots
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      businessId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (businessId) filter.businessId = businessId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const aiBots = await AIBot.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count
    const total = await AIBot.countDocuments(filter);

    res.json({
      error: false,
      data: {
        aiBots,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get AI bots error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch AI bots'
    });
  }
});

// @route   GET /api/ai-bot/:id
// @desc    Get AI bot by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    res.json({
      error: false,
      data: aiBot
    });

  } catch (error) {
    console.error('Get AI bot error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch AI bot'
    });
  }
});

// @route   PUT /api/ai-bot/:id
// @desc    Update AI bot
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    // Update fields
    const allowedUpdates = [
      'name', 'description', 'status', 'configuration', 
      'trainingData', 'aiModel', 'settings'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        aiBot[field] = req.body[field];
      }
    });

    await aiBot.save();

    // Log activity
    await logActivity('ai_bot_updated', {
      botId: aiBot._id,
      updatedFields: Object.keys(req.body)
    });

    res.json({
      error: false,
      message: 'AI Bot updated successfully',
      data: aiBot
    });

  } catch (error) {
    console.error('Update AI bot error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update AI bot'
    });
  }
});

// @route   POST /api/ai-bot/:id/train
// @desc    Train AI bot with new data
// @access  Private
router.post('/:id/train', async (req, res) => {
  try {
    const { faqs, businessInfo, customResponses } = req.body;

    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    // Update training data
    if (faqs) {
      aiBot.trainingData.faqs = [...(aiBot.trainingData.faqs || []), ...faqs];
    }

    if (businessInfo) {
      aiBot.trainingData.businessInfo = { ...aiBot.trainingData.businessInfo, ...businessInfo };
    }

    if (customResponses) {
      aiBot.trainingData.customResponses = [...(aiBot.trainingData.customResponses || []), ...customResponses];
    }

    // Update status to training
    aiBot.status = 'training';

    await aiBot.save();

    // Log activity
    await logActivity('ai_bot_training_started', {
      botId: aiBot._id,
      newFaqs: faqs?.length || 0,
      newResponses: customResponses?.length || 0
    });

    res.json({
      error: false,
      message: 'AI Bot training started',
      data: {
        id: aiBot._id,
        status: aiBot.status,
        totalFaqs: aiBot.trainingData.faqs?.length || 0,
        totalResponses: aiBot.trainingData.customResponses?.length || 0
      }
    });

  } catch (error) {
    console.error('Train AI bot error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to start AI bot training'
    });
  }
});

// @route   POST /api/ai-bot/:id/chat
// @desc    Process chat message with AI bot
// @access  Public
router.post('/:id/chat', async (req, res) => {
  try {
    const { message, userId, channel, context } = req.body;

    if (!message) {
      return res.status(400).json({
        error: true,
        message: 'Message is required'
      });
    }

    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    if (aiBot.status !== 'active') {
      return res.status(400).json({
        error: true,
        message: 'AI Bot is not active'
      });
    }

    // Process message with AI
    const startTime = Date.now();
    const aiResponse = await processAIResponse(message, aiBot, context);
    const responseTime = Date.now() - startTime;

    // Update performance metrics
    await aiBot.updatePerformance({
      resolved: aiResponse.resolved,
      responseTime: responseTime
    });

    // Log activity
    await logActivity('ai_bot_chat', {
      botId: aiBot._id,
      messageLength: message.length,
      responseTime: responseTime,
      resolved: aiResponse.resolved,
      channel: channel || 'unknown'
    });

    res.json({
      error: false,
      data: {
        response: aiResponse.response,
        confidence: aiResponse.confidence,
        resolved: aiResponse.resolved,
        responseTime: responseTime,
        suggestions: aiResponse.suggestions || [],
        escalation: aiResponse.escalation || false
      }
    });

  } catch (error) {
    console.error('AI Bot chat error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to process message'
    });
  }
});

// @route   GET /api/ai-bot/:id/performance
// @desc    Get AI bot performance metrics
// @access  Private
router.get('/:id/performance', async (req, res) => {
  try {
    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    const performance = {
      ...aiBot.performance,
      resolutionRate: aiBot.resolutionRate,
      dailyStats: aiBot.analytics.dailyStats.slice(-30), // Last 30 days
      topQuestions: aiBot.analytics.topQuestions.slice(0, 10), // Top 10 questions
      recentFeedback: aiBot.analytics.userFeedback.slice(-5) // Last 5 feedback
    };

    res.json({
      error: false,
      data: performance
    });

  } catch (error) {
    console.error('Get AI bot performance error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch performance metrics'
    });
  }
});

// @route   POST /api/ai-bot/:id/feedback
// @desc    Submit feedback for AI bot response
// @access  Public
router.post('/:id/feedback', async (req, res) => {
  try {
    const { rating, comment, conversationId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: true,
        message: 'Valid rating (1-5) is required'
      });
    }

    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    // Add feedback
    aiBot.analytics.userFeedback.push({
      rating: parseInt(rating),
      comment: comment || '',
      timestamp: new Date()
    });

    // Update average satisfaction
    const totalRating = aiBot.analytics.userFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
    aiBot.performance.customerSatisfaction = totalRating / aiBot.analytics.userFeedback.length;

    await aiBot.save();

    // Log activity
    await logActivity('ai_bot_feedback_submitted', {
      botId: aiBot._id,
      rating: rating,
      hasComment: !!comment
    });

    res.json({
      error: false,
      message: 'Feedback submitted successfully',
      data: {
        averageRating: aiBot.performance.customerSatisfaction.toFixed(2),
        totalFeedback: aiBot.analytics.userFeedback.length
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to submit feedback'
    });
  }
});

// @route   DELETE /api/ai-bot/:id
// @desc    Delete AI bot (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const aiBot = await AIBot.findById(req.params.id);
    
    if (!aiBot) {
      return res.status(404).json({
        error: true,
        message: 'AI Bot not found'
      });
    }

    // Soft delete - change status to archived
    aiBot.status = 'archived';
    await aiBot.save();

    // Log activity
    await logActivity('ai_bot_archived', {
      botId: aiBot._id
    });

    res.json({
      error: false,
      message: 'AI Bot archived successfully'
    });

  } catch (error) {
    console.error('Delete AI bot error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to archive AI bot'
    });
  }
});

module.exports = router;
