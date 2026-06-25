const mongoose = require('mongoose');


const HourSlotSchema = new mongoose.Schema({
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  }
}, { _id: false });


const WeeklyAvailabilitySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0, // Sunday
    max: 6  // Saturday
  },
  slots: {
    type: [HourSlotSchema],
    validate: v => v.length > 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });


const DateAvailabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  slots: {
    type: [HourSlotSchema],
    validate: v => v.length > 0
  }
}, { _id: false });


const UnavailabilitySchema = new mongoose.Schema({
  from: {
    type: Date,
    required: true
  },
  to: {
    type: Date,
    required: true
  },
  reason: {
    type: String
  }
}, { _id: false });

const MentorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  title: { type: String, required: true },
  about: { type: String, required: true, maxlength: 120 * 8 }, // 120 words max (approx)
  idealMentee: { type: String },
  topics: [{ type: String, required: true }], // 4-8 items
  sessionDurations: [
    {
      duration: { type: String, required: true },
      priceUSD: { type: Number, required: true },
      pricePKR: { type: Number, required: true }
    }
  ],
  languages: [{ type: String, required: true }],
  donationInfo: { type: String },
  funFact: { type: String },
  headshot: { type: String }, // image file path or URL
  socialLinks: {
    linkedin: { type: String },
    twitter: { type: String },
    instagram: { type: String }
  },

  timezone: {
    type: String,
    required: true,
    default: 'Asia/Karachi'
  },

  availability: {
    weekly: {
      type: [WeeklyAvailabilitySchema],
      default: []
    },
    specificDates: {
      type: [DateAvailabilitySchema],
      default: []
    },
    unavailability: {
      type: [UnavailabilitySchema],
      default: []
    }
  },

  isAvailableForBooking: {
    type: Boolean,
    default: true
  },

  paypal: {
    isConnected: { type: Boolean, default: false },
    merchantId: String,
    email: String,
    connectedAt: Date,
    payments_receivable: { type: Boolean, default: false },
    trackingId: String,
    onboardingPending: { type: Boolean, default: false },
    onboardingStartedAt: Date
  }

}, { timestamps: true });


module.exports = mongoose.model('MentorProfile', MentorProfileSchema);
