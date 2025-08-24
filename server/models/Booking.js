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
    enum: ['1:1'],
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
  // For future use if needed
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
    default: 1, // Always 1 for 1:1 sessions
    min: 1,
    max: 1,
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
  startTime: 1
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
bookingSchema.statics.isSlotAvailable = async function(mentorId, date, startTime, endTime) {
  // For 1:1 sessions, check if slot overlaps with any existing booking
  // Convert times to minutes for easier comparison
  const requestedStart = timeToMinutes(startTime);
  const requestedEnd = timeToMinutes(endTime);
  
  const existingBookings = await this.find({
    mentor: mentorId,
    scheduledDate: date,
    status: { $nin: ['cancelled', 'no-show'] }
  });

  // Check for any overlapping bookings
  for (const booking of existingBookings) {
    const bookingStart = timeToMinutes(booking.startTime);
    const bookingEnd = timeToMinutes(booking.endTime);
    
    // Check if there's any overlap
    if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
      return false; // Slot is not available due to overlap
    }
  }

  return true; // No overlapping bookings found
};

// Helper function to convert time string to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Method to add participant (not used for 1:1 sessions)
bookingSchema.methods.addParticipant = function(userId) {
  throw new Error('Cannot add participants to 1:1 sessions');
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
