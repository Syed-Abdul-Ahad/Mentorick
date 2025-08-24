const mongoose = require('mongoose');

const megaSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
    required: [true, 'Mentor is required'],
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
  },
  startTime: {
    type: String, // Format: "HH:mm"
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'],
  },
  endTime: {
    type: String, // Format: "HH:mm"  
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'],
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: [30, 'Duration must be at least 30 minutes'],
    max: [480, 'Duration cannot exceed 8 hours'],
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: 2,
    max: 100,
    default: 20,
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  meetingLink: {
    type: String,
    trim: true,
  },
  meetingPlatform: {
    type: String,
    enum: ['zoom', 'meet', 'teams', 'other'],
    default: 'zoom',
  },
  // Track all participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'no-show'],
      default: 'registered',
    }
  }],
  // Payment related fields
  price: {
    type: Number,
    min: 0,
    default: 0,
  },
  currency: {
    type: String,
    enum: ['USD', 'PKR'],
    default: 'USD',
  },
  // Timezone information
  mentorTimezone: {
    type: String,
    required: [true, 'Mentor timezone is required'],
  },
  // Admin who created this session
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
  // Cancellation details
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters'],
  },
  cancelledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
megaSessionSchema.index({ mentor: 1, scheduledDate: -1 });
megaSessionSchema.index({ status: 1 });
megaSessionSchema.index({ scheduledDate: 1, startTime: 1 });

// Virtual to get full date-time
megaSessionSchema.virtual('startDateTime').get(function() {
  const date = new Date(this.scheduledDate);
  const [hours, minutes] = this.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

megaSessionSchema.virtual('endDateTime').get(function() {
  const date = new Date(this.scheduledDate);
  const [hours, minutes] = this.endTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Virtual to get available spots
megaSessionSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.participants.length;
});

// Method to add participant
megaSessionSchema.methods.addParticipant = function(userId) {
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Session is full');
  }

  // Check if user is already a participant
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already registered for this session');
  }

  this.participants.push({ user: userId });
  return this.save();
};

// Method to remove participant
megaSessionSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Pre-save middleware to calculate end time based on duration
megaSessionSchema.pre('save', function(next) {
  if (this.startTime && this.duration && !this.endTime) {
    const [hours, minutes] = this.startTime.split(':');
    const startMinutes = parseInt(hours) * 60 + parseInt(minutes);
    const endMinutes = startMinutes + this.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    this.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MegaSession', megaSessionSchema);
