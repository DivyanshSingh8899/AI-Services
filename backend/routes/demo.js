const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendDemoConfirmation, sendDemoReminder } = require('../services/emailService');
const { logActivity } = require('../services/analyticsService');

const router = express.Router();

// Validation middleware for demo booking
const validateDemoBooking = [
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
  body('phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Please provide a valid phone number'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('businessType')
    .isIn(['retail', 'clinic', 'restaurant', 'gym', 'ecommerce', 'service', 'other'])
    .withMessage('Please select a valid business type'),
  body('preferredDate')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('preferredTime')
    .isIn(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'])
    .withMessage('Please select a valid time slot'),
  body('demoType')
    .isIn(['ai-support-bot', 'ai-automation', 'ai-analytics', 'custom'])
    .withMessage('Please select a valid demo type'),
  body('teamSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Team size must be between 1 and 1000'),
  body('currentChallenges')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Current challenges cannot exceed 500 characters')
];

// @route   POST /api/demo/book
// @desc    Book a demo session
// @access  Public
router.post('/book', validateDemoBooking, async (req, res) => {
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

    // Check if demo slot is available
    const demoDate = new Date(req.body.preferredDate);
    const demoTime = req.body.preferredTime;
    
    // Check if date is in the future
    if (demoDate <= new Date()) {
      return res.status(400).json({
        error: true,
        message: 'Demo date must be in the future'
      });
    }

    // Check if time slot is available (basic availability check)
    const existingDemo = await Contact.findOne({
      inquiryType: 'demo',
      'demoDetails.preferredDate': demoDate,
      'demoDetails.preferredTime': demoTime,
      status: { $in: ['pending', 'contacted', 'qualified'] }
    });

    if (existingDemo) {
      return res.status(409).json({
        error: true,
        message: 'This time slot is already booked. Please select another time.',
        availableSlots: await getAvailableSlots(demoDate)
      });
    }

    // Create demo contact
    const demoContact = new Contact({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      inquiryType: 'demo',
      message: req.body.currentChallenges || 'Demo booking request',
      priority: 'high',
      demoDetails: {
        preferredDate: demoDate,
        preferredTime: demoTime,
        demoType: req.body.demoType,
        teamSize: req.body.teamSize,
        currentChallenges: req.body.currentChallenges,
        timezone: req.body.timezone || 'Asia/Kolkata'
      },
      source: 'website',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    // Save to database
    await demoContact.save();

    // Send confirmation email
    try {
      await sendDemoConfirmation(demoContact);
    } catch (emailError) {
      console.error('Failed to send demo confirmation email:', emailError);
    }

    // Log activity
    await logActivity('demo_booked', {
      contactId: demoContact._id,
      demoType: req.body.demoType,
      demoDate: demoDate,
      businessType: req.body.businessType
    });

    // Return success response
    res.status(201).json({
      error: false,
      message: 'Demo booked successfully! We\'ll send you a confirmation email shortly.',
      data: {
        id: demoContact._id,
        demoDate: demoDate.toISOString().split('T')[0],
        demoTime: demoTime,
        demoType: req.body.demoType,
        confirmationEmail: req.body.email,
        nextSteps: [
          'Check your email for confirmation details',
          'Add the demo to your calendar',
          'Prepare any specific questions you have',
          'We\'ll send a reminder 1 hour before the demo'
        ]
      }
    });

  } catch (error) {
    console.error('Demo booking error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to book demo. Please try again later.'
    });
  }
});

// @route   GET /api/demo/availability
// @desc    Get available demo slots for a date
// @access  Public
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        error: true,
        message: 'Date parameter is required'
      });
    }

    const requestedDate = new Date(date);
    
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        error: true,
        message: 'Invalid date format'
      });
    }

    const availableSlots = await getAvailableSlots(requestedDate);

    res.json({
      error: false,
      data: {
        date: date,
        availableSlots,
        businessHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'Asia/Kolkata'
        },
        note: 'All times are in Indian Standard Time (IST)'
      }
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to check availability'
    });
  }
});

// @route   GET /api/demo/slots
// @desc    Get all demo slots for a date range
// @access  Private
router.get('/slots', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const filter = {
      inquiryType: 'demo'
    };

    if (startDate && endDate) {
      filter['demoDetails.preferredDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) {
      filter.status = status;
    }

    const demos = await Contact.find(filter)
      .sort({ 'demoDetails.preferredDate': 1, 'demoDetails.preferredTime': 1 })
      .select('firstName lastName businessName demoDetails status createdAt');

    res.json({
      error: false,
      data: demos
    });

  } catch (error) {
    console.error('Get demo slots error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch demo slots'
    });
  }
});

// @route   PUT /api/demo/:id/reschedule
// @desc    Reschedule a demo
// @access  Private
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        error: true,
        message: 'New date and time are required'
      });
    }

    const demo = await Contact.findById(req.params.id);
    
    if (!demo || demo.inquiryType !== 'demo') {
      return res.status(404).json({
        error: true,
        message: 'Demo not found'
      });
    }

    // Check if new slot is available
    const newDemoDate = new Date(newDate);
    const existingDemo = await Contact.findOne({
      _id: { $ne: demo._id },
      inquiryType: 'demo',
      'demoDetails.preferredDate': newDemoDate,
      'demoDetails.preferredTime': newTime,
      status: { $in: ['pending', 'contacted', 'qualified'] }
    });

    if (existingDemo) {
      return res.status(409).json({
        error: true,
        message: 'This time slot is already booked'
      });
    }

    // Update demo details
    const oldDate = demo.demoDetails.preferredDate;
    const oldTime = demo.demoDetails.preferredTime;
    
    demo.demoDetails.preferredDate = newDemoDate;
    demo.demoDetails.preferredTime = newTime;
    demo.status = 'contacted';

    // Add reschedule note
    demo.notes = demo.notes || [];
    demo.notes.push({
      status: 'rescheduled',
      notes: `Demo rescheduled from ${oldDate.toDateString()} ${oldTime} to ${newDemoDate.toDateString()} ${newTime}. Reason: ${reason || 'Not specified'}`,
      timestamp: new Date()
    });

    await demo.save();

    // Send reschedule confirmation
    try {
      await sendDemoConfirmation(demo, true);
    } catch (emailError) {
      console.error('Failed to send reschedule confirmation:', emailError);
    }

    // Log activity
    await logActivity('demo_rescheduled', {
      contactId: demo._id,
      oldDate: oldDate,
      newDate: newDemoDate,
      reason: reason
    });

    res.json({
      error: false,
      message: 'Demo rescheduled successfully',
      data: {
        id: demo._id,
        newDate: newDemoDate.toISOString().split('T')[0],
        newTime: newTime,
        oldDate: oldDate.toISOString().split('T')[0],
        oldTime: oldTime
      }
    });

  } catch (error) {
    console.error('Reschedule demo error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to reschedule demo'
    });
  }
});

// Helper function to get available slots
async function getAvailableSlots(date) {
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  
  // Get booked slots for the date
  const bookedSlots = await Contact.find({
    inquiryType: 'demo',
    'demoDetails.preferredDate': {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    },
    status: { $in: ['pending', 'contacted', 'qualified'] }
  }).select('demoDetails.preferredTime');

  const bookedTimes = bookedSlots.map(slot => slot.demoDetails.preferredTime);
  
  // Filter out booked slots
  const availableSlots = timeSlots.filter(slot => !bookedTimes.includes(slot));
  
  return availableSlots;
}

module.exports = router;
