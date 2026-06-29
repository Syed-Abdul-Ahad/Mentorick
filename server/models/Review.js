const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor is required'],
    index: true,
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer is required'],
    index: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    default: '',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.index({ mentor: 1, createdAt: -1 });
reviewSchema.index({ mentor: 1, mentee: 1, createdAt: -1 });
reviewSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Review', reviewSchema);
