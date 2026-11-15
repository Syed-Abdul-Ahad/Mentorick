const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for mega sessions
  mentorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },

  // Mega session fields
  isMegaSession: { type: Boolean, default: false },
  title: { type: String },
  description: { type: String },
  maxParticipants: { type: Number, default: 1 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentMegaSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  startTimeUTC: { type: Date, required: true },
  endTimeUTC: { type: Date, required: true },

  durationMinutes: { type: Number, enum: [15, 30, 60, 90], required: true },

  mentorTimezone: { type: String, required: true },
  menteeTimezone: { type: String, required: true },

  price: {
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'PKR'], required: true }
  },

  payment: {
    provider: {
      type: String,
      enum: ['bank_transfer', 'payfast'],
      default: 'bank_transfer'
    },
    status: {
      type: String,
      enum: ['awaiting_proof', 'awaiting_verification', 'paid', 'expired', 'failed', 'rejected'],
      default: 'awaiting_proof'
    },
    amount: { type: Number },
    currency: { type: String, enum: ['USD', 'PKR'] },
    platformFee: { type: Number },
    mentorPayoutAmount: { type: Number },
    proofImageUrl: { type: String },
    proofUploadedAt: { type: Date },
    proofDueAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    // Reserved for PayFast later
    externalOrderId: { type: String },
    externalPaymentId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
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
BookingSchema.index({ parentMegaSession: 1, mentee: 1, status: 1 });
BookingSchema.index({ status: 1, 'payment.status': 1, 'payment.proofDueAt': 1 });

module.exports = mongoose.model('Booking', BookingSchema);
