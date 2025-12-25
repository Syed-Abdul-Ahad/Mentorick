const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for mega sessions
  mentorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  
  // Mega session fields
  isMegaSession: { type: Boolean, default: false },
  title: { type: String }, // Title for mega session
  description: { type: String }, // Description for mega session  
  maxParticipants: { type: Number, default: 1 }, // Max number of mentees (1 for individual, >1 for mega)
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of mentees who joined
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who created mega session
  parentMegaSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // Link to parent mega session for individual tracking

  startTimeUTC: { type: Date, required: true },
  endTimeUTC: { type: Date, required: true },

  durationMinutes: { type: Number, enum: [15, 30, 60], required: true },

  mentorTimezone: { type: String, required: true },
  menteeTimezone: { type: String, required: true },

  price: {
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'PKR'], required: true }
  },

  payment: {
    provider: String,
    transactionId: String,
    status: { type: String }
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },

  meeting: {
    provider: { type: String, enum: ['google'] },
    meetingLink: String,
    calendarEventId: String
  }

}, { timestamps: true });

BookingSchema.index({ mentor: 1, startTimeUTC: 1, endTimeUTC: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
