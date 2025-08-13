const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const path = require('path');

// Create or update mentor profile
exports.createOrUpdateMentorProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = req.body;
    let headshotUrl = req.body.headshot;
    if (req.file) {
      headshotUrl = `${req.protocol}://${req.get('host')}/uploads/mentors/${req.file.filename}`;
    }
    const profileData = {
      ...data,
      user: userId,
      headshot: headshotUrl,
      topics: Array.isArray(data.topics) ? data.topics : (data.topics ? [data.topics] : []),
      languages: Array.isArray(data.languages) ? data.languages : (data.languages ? [data.languages] : []),
      sessionDurations: data.sessionDurations ? JSON.parse(data.sessionDurations) : []
    };
    let profile = await MentorProfile.findOneAndUpdate(
      { user: userId },
      profileData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get mentor profile by ID (public)
exports.getMentorProfileById = async (req, res, next) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.params.id }).populate('user', 'role');
    if (!profile) return res.status(404).json({ success: false, message: 'Mentor profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get logged-in mentor's profile
exports.getMyMentorProfile = async (req, res, next) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};
