const MenteeProfile = require('../models/MenteeProfile');
const User = require('../models/User');
const path = require('path');

// Create or update mentee profile
exports.createOrUpdateMenteeProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = req.body;
    let headshotUrl = req.body.headshot;
    if (req.file) {
      headshotUrl = `${req.protocol}://${req.get('host')}/uploads/mentees/${req.file.filename}`;
    }
    const profileData = {
      ...data,
      user: userId,
      headshot: headshotUrl,
      interests: Array.isArray(data.interests) ? data.interests : (data.interests ? [data.interests] : []),
      languages: Array.isArray(data.languages) ? data.languages : (data.languages ? [data.languages] : [])
    };
    let profile = await MenteeProfile.findOneAndUpdate(
      { user: userId },
      profileData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get mentee profile by ID (public)
exports.getMenteeProfileById = async (req, res, next) => {
  try {
    const profile = await MenteeProfile.findOne({ user: req.params.id }).populate('user', 'role');
    if (!profile) return res.status(404).json({ success: false, message: 'Mentee profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get logged-in mentee's profile
exports.getMyMenteeProfile = async (req, res, next) => {
  try {
    const profile = await MenteeProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};
