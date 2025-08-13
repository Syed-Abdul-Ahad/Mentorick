const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: [true, 'Mentor is required'],
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentee is required'],
  },
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Session description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  objectives: [{
    type: String,
    trim: true,
  }],
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
  },
  meetingLink: {
    type: String,
    trim: true,
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'google-meet', 'microsoft-teams', 'skype', 'discord', 'other'],
    default: 'zoom',
  },
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    paymentMethod: String,
    transactionId: String,
  },
  feedback: {
    mentorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
      },
      submittedAt: Date,
    },
    menteeFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
      },
      submittedAt: Date,
    },
  },
  notes: {
    mentorNotes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    menteeNotes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
  },
  materials: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['document', 'video', 'audio', 'image', 'link', 'other'],
    },
    uploadedBy: {
      type: String,
      enum: ['mentor', 'mentee'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  recordingUrl: String,
  actualStartTime: Date,
  actualEndTime: Date,
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cancelledAt: Date,
  reminders: {
    mentorReminded: {
      type: Boolean,
      default: false,
    },
    menteeReminded: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpScheduled: Date,
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for session duration in hours
sessionSchema.virtual('durationInHours').get(function() {
  return this.duration / 60;
});

// Virtual for actual session duration
sessionSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Index for better query performance
sessionSchema.index({ mentor: 1, scheduledDate: 1 });
sessionSchema.index({ mentee: 1, scheduledDate: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ scheduledDate: 1 });
sessionSchema.index({ 'pricing.paymentStatus': 1 });

// Populate mentor and mentee data when querying sessions
sessionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'mentor',
    select: 'user expertise rating',
    populate: {
      path: 'user',
      select: 'firstName lastName email avatar',
    },
  }).populate({
    path: 'mentee',
    select: 'firstName lastName email avatar',
  });
  next();
});

// Pre-save middleware to calculate total amount
sessionSchema.pre('save', function(next) {
  if (this.isModified('duration') || this.isModified('pricing.hourlyRate')) {
    this.pricing.totalAmount = (this.duration / 60) * this.pricing.hourlyRate;
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
