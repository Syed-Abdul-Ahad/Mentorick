const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
    required: [true, 'Mentor is required'],
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentee is required'],
  },
  availability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability',
    required: [true, 'Availability slot is required'],
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
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours'],
  },
  sessionType: {
    type: String,
    enum: ['1:1', 'mega'],
    required: [true, 'Session type is required'],
    default: '1:1',
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'completed', 'cancelled', 'no-show'],
    default: 'confirmed',
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
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  // For Mega Sessions - track all participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'no-show'],
      default: 'registered',
    }
  }],
  maxParticipants: {
    type: Number,
    default: 1, // 1 for 1:1 sessions
    min: 1,
    max: 100,
  },
  // Payment related fields (for future use)
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  amount: {
    type: Number,
    min: 0,
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
  menteeTimezone: {
    type: String,
    required: [true, 'Mentee timezone is required'],
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

// Compound index to prevent double booking for 1:1 sessions
bookingSchema.index({ 
  mentor: 1, 
  scheduledDate: 1, 
  startTime: 1, 
  sessionType: 1 
});

// Index for efficient querying
bookingSchema.index({ mentee: 1, scheduledDate: -1 });
bookingSchema.index({ mentor: 1, scheduledDate: -1 });
bookingSchema.index({ status: 1 });

// Virtual to get full date-time
bookingSchema.virtual('startDateTime').get(function() {
  const date = new Date(this.scheduledDate);
  const [hours, minutes] = this.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

bookingSchema.virtual('endDateTime').get(function() {
  const date = new Date(this.scheduledDate);
  const [hours, minutes] = this.endTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Method to check if booking slot is available for 1:1 sessions
bookingSchema.statics.isSlotAvailable = async function(mentorId, date, startTime, endTime, sessionType = '1:1') {
  if (sessionType === 'mega') {
    // For mega sessions, check if there's room for more participants
    const existingBooking = await this.findOne({
      mentor: mentorId,
      scheduledDate: date,
      startTime,
      endTime,
      sessionType: 'mega',
      status: { $nin: ['cancelled', 'no-show'] }
    });

    if (existingBooking) {
      return existingBooking.participants.length < existingBooking.maxParticipants;
    }
    return true;
  } else {
    // For 1:1 sessions, check if slot is completely free
    const existingBooking = await this.findOne({
      mentor: mentorId,
      scheduledDate: date,
      startTime,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    return !existingBooking;
  }
};

// Method to add participant to mega session
bookingSchema.methods.addParticipant = function(userId) {
  if (this.sessionType !== 'mega') {
    throw new Error('Can only add participants to mega sessions');
  }

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

// Pre-save middleware to set end time based on duration
bookingSchema.pre('save', function(next) {
  if (this.startTime && this.duration) {
    const [hours, minutes] = this.startTime.split(':');
    const startMinutes = parseInt(hours) * 60 + parseInt(minutes);
    const endMinutes = startMinutes + this.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    this.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
