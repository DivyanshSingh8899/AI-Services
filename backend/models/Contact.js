const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: ['retail', 'clinic', 'restaurant', 'gym', 'ecommerce', 'service', 'other'],
    default: 'other'
  },
  inquiryType: {
    type: String,
    required: [true, 'Inquiry type is required'],
    enum: ['demo', 'pricing', 'custom', 'support', 'other'],
    default: 'demo'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'qualified', 'converted', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  source: {
    type: String,
    enum: ['website', 'referral', 'social', 'advertisement', 'other'],
    default: 'website'
  },
  demoDetails: {
    preferredDate: Date,
    preferredTime: String,
    demoType: String,
    teamSize: Number,
    currentChallenges: String,
    timezone: String
  },
  notes: [{
    status: String,
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  utmData: {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_term: String,
    utm_content: String
  },
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ businessName: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ priority: 1, status: 1 });
contactSchema.index({ 'demoDetails.preferredDate': 1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for business info
contactSchema.virtual('businessInfo').get(function() {
  return `${this.businessName} (${this.businessType})`;
});

// Pre-save middleware
contactSchema.pre('save', function(next) {
  // Convert business type to title case
  if (this.businessType) {
    this.businessType = this.businessType.charAt(0).toUpperCase() + this.businessType.slice(1);
  }
  
  // Convert inquiry type to title case
  if (this.inquiryType) {
    this.inquiryType = this.inquiryType.charAt(0).toUpperCase() + this.inquiryType.slice(1);
  }
  
  next();
});

// Static method to get contact statistics
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        byBusinessType: { $push: '$businessType' },
        byInquiryType: { $push: '$inquiryType' }
      }
    }
  ]);
  
  return stats[0] || { total: 0, pending: 0, contacted: 0, converted: 0 };
};

// Instance method to update status
contactSchema.methods.updateStatus = function(newStatus, notes) {
  this.status = newStatus;
  if (notes) {
    this.notes = this.notes || [];
    this.notes.push({
      status: newStatus,
      notes,
      timestamp: new Date()
    });
  }
  return this.save();
};

module.exports = mongoose.model('Contact', contactSchema);
