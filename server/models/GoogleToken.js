// models/GoogleToken.js
const mongoose = require('mongoose');

const GoogleTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true
  },

  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiryDate: { type: Date, required: true }

}, { timestamps: true });

module.exports = mongoose.model('GoogleToken', GoogleTokenSchema);
