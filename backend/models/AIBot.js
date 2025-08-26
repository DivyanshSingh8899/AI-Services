const mongoose = require('mongoose');

const aiBotSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Bot name is required'],
    trim: true,
    maxlength: [100, 'Bot name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'training', 'active', 'paused', 'archived'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['customer-support', 'sales', 'appointment', 'general', 'custom'],
    default: 'customer-support'
  },
  channels: [{
    type: String,
    enum: ['whatsapp', 'website', 'email', 'instagram', 'facebook', 'telegram'],
    required: true
  }],
  configuration: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'gu', 'ta', 'te', 'kn', 'ml', 'bn', 'pa']
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    businessHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      }
    },
    autoReply: {
      enabled: {
        type: Boolean,
        default: true
      },
      message: {
        type: String,
        default: 'Thank you for your message. Our AI assistant will help you shortly.'
      }
    },
    escalation: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 3
      },
      contactEmail: String,
      contactPhone: String
    }
  },
  trainingData: {
    faqs: [{
      question: {
        type: String,
        required: true,
        trim: true
      },
      answer: {
        type: String,
        required: true,
        trim: true
      },
      category: {
        type: String,
        trim: true
      },
      tags: [String],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.8
      }
    }],
    businessInfo: {
      name: String,
      description: String,
      services: [String],
      products: [String],
      pricing: [{
        service: String,
        price: String,
        description: String
      }],
      operatingHours: String,
      location: String,
      contactInfo: {
        phone: String,
        email: String,
        address: String
      }
    },
    customResponses: [{
      trigger: {
        type: String,
        required: true
      },
      response: {
        type: String,
        required: true
      },
      context: String
    }]
  },
  aiModel: {
    provider: {
      type: String,
      enum: ['openai', 'claude', 'custom', 'local'],
      default: 'openai'
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    apiKey: String,
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 150
    }
  },
  performance: {
    totalConversations: {
      type: Number,
      default: 0
    },
    successfulResolutions: {
      type: Number,
      default: 0
    },
    escalationRate: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  analytics: {
    dailyStats: [{
      date: {
        type: Date,
        required: true
      },
      conversations: Number,
      resolutions: Number,
      escalations: Number,
      avgResponseTime: Number
    }],
    topQuestions: [{
      question: String,
      count: Number,
      category: String
    }],
    userFeedback: [{
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowLearning: {
      type: Boolean,
      default: true
    },
    maxDailyConversations: {
      type: Number,
      default: 1000
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
aiBotSchema.index({ businessId: 1 });
aiBotSchema.index({ status: 1 });
aiBotSchema.index({ type: 1 });
aiBotSchema.index({ 'performance.totalConversations': -1 });

// Virtual for resolution rate
aiBotSchema.virtual('resolutionRate').get(function() {
  if (this.performance.totalConversations === 0) return 0;
  return (this.performance.successfulResolutions / this.performance.totalConversations * 100).toFixed(2);
});

// Virtual for active status
aiBotSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Pre-save middleware
aiBotSchema.pre('save', function(next) {
  // Update performance metrics
  if (this.performance.totalConversations > 0) {
    this.performance.escalationRate = 
      ((this.performance.totalConversations - this.performance.successfulResolutions) / 
       this.performance.totalConversations * 100).toFixed(2);
  }
  
  this.performance.lastUpdated = new Date();
  next();
});

// Static method to get bot statistics
aiBotSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        totalConversations: { $sum: '$performance.totalConversations' },
        avgSatisfaction: { $avg: '$performance.customerSatisfaction' }
      }
    }
  ]);
  
  return stats[0] || { total: 0, active: 0, totalConversations: 0, avgSatisfaction: 0 };
};

// Instance method to update performance
aiBotSchema.methods.updatePerformance = function(conversationData) {
  this.performance.totalConversations += 1;
  
  if (conversationData.resolved) {
    this.performance.successfulResolutions += 1;
  }
  
  if (conversationData.responseTime) {
    const currentTotal = this.performance.averageResponseTime * (this.performance.totalConversations - 1);
    this.performance.averageResponseTime = (currentTotal + conversationData.responseTime) / this.performance.totalConversations;
  }
  
  return this.save();
};

module.exports = mongoose.model('AIBot', aiBotSchema);
