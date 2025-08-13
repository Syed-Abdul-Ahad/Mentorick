const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

module.exports = mongoose.model('MentorProfile', MentorProfileSchema);
