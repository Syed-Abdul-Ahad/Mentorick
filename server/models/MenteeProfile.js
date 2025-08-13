const mongoose = require('mongoose');

const MenteeProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  about: { type: String, maxlength: 120 * 8 }, // 120 words max (approx)
  interests: [{ type: String }], // 4-8 items
  languages: [{ type: String }],
  funFact: { type: String },
  headshot: { type: String }, // image file path or URL
  socialLinks: {
    linkedin: { type: String },
    twitter: { type: String },
    instagram: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('MenteeProfile', MenteeProfileSchema);
