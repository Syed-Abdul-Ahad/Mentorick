const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session is required'],
  },
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },
  aspects: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    knowledge: {
      type: Number,
      min: 1,
      max: 5,
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  mentorResponse: {
    comment: {
      type: String,
      maxlength: [500, 'Response cannot exceed 500 characters'],
    },
    respondedAt: Date,
  },
  helpful: {
    count: {
      type: Number,
      default: 0,
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  reported: {
    isReported: {
      type: Boolean,
      default: false,
    },
    reportedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for better query performance
reviewSchema.index({ mentor: 1, rating: -1 });
reviewSchema.index({ mentee: 1 });
reviewSchema.index({ session: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isPublic: 1 });

// Ensure one review per session per mentee
reviewSchema.index({ session: 1, mentee: 1 }, { unique: true });

// Populate mentee data when querying reviews
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'mentee',
    select: 'firstName lastName avatar',
  });
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
