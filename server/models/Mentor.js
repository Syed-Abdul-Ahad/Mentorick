const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  expertise: [{
    type: String,
    required: [true, 'At least one area of expertise is required'],
    trim: true,
  }],
  experience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years'],
  },
  education: [{
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false,
    },
  }],
  workExperience: [{
    company: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false,
    },
  }],
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true,
    },
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    issuer: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expirationDate: Date,
    credentialId: String,
    credentialUrl: String,
  }],
  pricing: {
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    },
    packageDeals: [{
      name: String,
      description: String,
      sessions: Number,
      price: Number,
      duration: Number, // in days
    }],
  },
  availability: {
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
    },
    weeklySchedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      available: {
        type: Boolean,
        default: true,
      },
      timeSlots: [{
        startTime: String, // Format: "HH:MM"
        endTime: String,   // Format: "HH:MM"
      }],
    }],
    unavailableDates: [{
      date: Date,
      reason: String,
    }],
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  totalSessions: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationDocuments: [{
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  portfolio: [{
    title: String,
    description: String,
    url: String,
    imageUrl: String,
    technologies: [String],
  }],
  languages: [{
    language: {
      type: String,
      required: true,
    },
    proficiency: {
      type: String,
      enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
      required: true,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for total earnings
mentorSchema.virtual('totalEarnings').get(function() {
  return this.totalRevenue;
});

// Index for better query performance
mentorSchema.index({ 'user': 1 });
mentorSchema.index({ 'expertise': 1 });
mentorSchema.index({ 'rating.average': -1 });
mentorSchema.index({ 'pricing.hourlyRate': 1 });
mentorSchema.index({ 'isVerified': 1 });
mentorSchema.index({ 'isActive': 1 });

// Populate user data when querying mentor
mentorSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email avatar profile.bio profile.location',
  });
  next();
});

module.exports = mongoose.model('Mentor', mentorSchema);
