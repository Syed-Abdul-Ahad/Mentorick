const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
    required: [true, 'Mentor is required'],
  },
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    required: [true, 'Day of week is required'],
    min: 0,
    max: 6,
  },
  startTime: {
    type: String, // Format: "HH:mm" (24-hour format)
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'],
  },
  endTime: {
    type: String, // Format: "HH:mm" (24-hour format)
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'],
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'UTC',
  },
  slotDuration: {
    type: Number, // Duration in minutes
    required: [true, 'Slot duration is required'],
    enum: [15, 30, 60, 90, 120], // Available slot durations
    default: 60,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // For recurring availability (weekly pattern)
  isRecurring: {
    type: Boolean,
    default: true,
  },
  // For specific dates (one-time availability)
  specificDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate availability slots
availabilitySchema.index({ 
  mentor: 1, 
  dayOfWeek: 1, 
  startTime: 1, 
  endTime: 1,
  specificDate: 1 
}, { unique: true });

// Virtual to get day name
availabilitySchema.virtual('dayName').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.dayOfWeek];
});

// Method to check if availability overlaps with another slot
availabilitySchema.methods.overlapsWithSlot = function(startTime, endTime) {
  const thisStart = this.startTime;
  const thisEnd = this.endTime;
  
  return (startTime < thisEnd && endTime > thisStart);
};

// Static method to find available slots for a mentor on a specific date
availabilitySchema.statics.findAvailableSlots = async function(mentorId, date, userTimezone = 'UTC') {
  const dayOfWeek = date.getDay();
  
  // Find mentor's availability for that day
  const availability = await this.find({
    mentor: mentorId,
    $or: [
      { dayOfWeek, isRecurring: true },
      { specificDate: { $gte: new Date(date.setHours(0,0,0,0)), $lt: new Date(date.setHours(23,59,59,999)) } }
    ],
    isActive: true
  });

  return availability;
};

module.exports = mongoose.model('Availability', availabilitySchema);
