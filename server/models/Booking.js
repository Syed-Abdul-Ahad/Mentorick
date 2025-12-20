const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  mentorProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
    required: true
  },

  startTimeUTC: {
    type: Date,
    required: true
  },
  endTimeUTC: {
    type: Date,
    required: true
  },

  durationMinutes: {
    type: Number,
    enum: [15, 30, 60],
    required: true
  },

  price: {
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'PKR'], required: true }
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },

  meeting: {
    provider: { type: String, enum: ['google'] },
    meetingLink: String,
    calendarEventId: String
  }

}, { timestamps: true });

/**
 * Prevent overlapping bookings at DB level
 */
BookingSchema.index({
  mentor: 1,
  startTimeUTC: 1,
  endTimeUTC: 1
});

module.exports = mongoose.model('Booking', BookingSchema);
