const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactNotification } = require('../services/emailService');
const { logActivity } = require('../services/analyticsService');

const router = express.Router();

// Validation middleware
const validateContact = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('businessType')
    .isIn(['retail', 'clinic', 'restaurant', 'gym', 'ecommerce', 'service', 'other'])
    .withMessage('Please select a valid business type'),
  body('inquiryType')
    .isIn(['demo', 'pricing', 'custom', 'support', 'other'])
    .withMessage('Please select a valid inquiry type'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

// @route   POST /api/contact
// @desc    Submit a new contact form
// @access  Public
router.post('/', validateContact, async (req, res) => {
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

    // Extract client information
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      utmData: {
        utm_source: req.query.utm_source,
        utm_medium: req.query.utm_medium,
        utm_campaign: req.query.utm_campaign,
        utm_term: req.query.utm_term,
        utm_content: req.query.utm_content
      }
    };

    // Create new contact
    const contact = new Contact({
      ...req.body,
      ...clientInfo,
      source: 'website'
    });

    // Save to database
    await contact.save();

    // Send notification email
    try {
      await sendContactNotification(contact);
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Log activity
    await logActivity('contact_submitted', {
      contactId: contact._id,
      businessType: contact.businessType,
      inquiryType: contact.inquiryType
    });

    // Return success response
    res.status(201).json({
      error: false,
      message: 'Thank you for your inquiry! We\'ll get back to you within 24 hours.',
      data: {
        id: contact._id,
        status: contact.status,
        estimatedResponseTime: '24 hours'
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contacts (admin only)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      businessType, 
      inquiryType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (businessType) filter.businessType = businessType;
    if (inquiryType) filter.inquiryType = inquiryType;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const contacts = await Contact.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count
    const total = await Contact.countDocuments(filter);

    res.json({
      error: false,
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch contacts'
    });
  }
});

// @route   GET /api/contact/export
// @desc    Export contacts to CSV
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const contacts = await Contact.find().select('-__v');
    
    if (!contacts.length) {
      return res.status(404).json({
        error: true,
        message: 'No contacts found'
      });
    }

    const csv = contacts.map(contact => ({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      businessName: contact.businessName,
      businessType: contact.businessType,
      inquiryType: contact.inquiryType,
      message: contact.message,
      status: contact.status,
      createdAt: contact.createdAt
    }));

    // Convert to CSV format
    const csvString = [
      Object.keys(csv[0]).join(','), // header
      ...csv.map(row => Object.values(row).join(',')) // data
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('contacts.csv');
    res.send(csvString);
  } catch (error) {
    console.error('Export contacts error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to export contacts'
    });
  }
});

// @route   GET /api/contact/stats
// @desc    Get contact statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await Contact.getStats();
    
    // Get additional stats
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName businessName status createdAt');

    const businessTypeStats = await Contact.aggregate([
      { $group: { _id: '$businessType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const inquiryTypeStats = await Contact.aggregate([
      { $group: { _id: '$inquiryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      error: false,
      data: {
        ...stats,
        recentContacts,
        businessTypeStats,
        inquiryTypeStats
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch contact statistics'
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get contact by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        error: true,
        message: 'Contact not found'
      });
    }

    res.json({
      error: false,
      data: contact
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch contact'
    });
  }
});

// @route   PUT /api/contact/:id
// @desc    Update contact status and details
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { status, priority, assignedTo, tags, notes } = req.body;

    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        error: true,
        message: 'Contact not found'
      });
    }

    // Update fields
    if (status) contact.status = status;
    if (priority) contact.priority = priority;
    if (assignedTo) contact.assignedTo = assignedTo;
    if (tags) contact.tags = tags;
    if (notes) {
      contact.notes = contact.notes || [];
      contact.notes.push({
        status: status || contact.status,
        notes,
        timestamp: new Date()
      });
    }

    await contact.save();

    // Log activity
    await logActivity('contact_updated', {
      contactId: contact._id,
      status: contact.status,
      priority: contact.priority
    });

    res.json({
      error: false,
      message: 'Contact updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update contact'
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        error: true,
        message: 'Contact not found'
      });
    }

    // Soft delete - change status to archived
    contact.status = 'archived';
    await contact.save();

    // Log activity
    await logActivity('contact_archived', {
      contactId: contact._id
    });

    res.json({
      error: false,
      message: 'Contact archived successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to archive contact'
    });
  }
});

module.exports = router;
