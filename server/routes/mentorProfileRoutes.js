const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createOrUpdateMentorProfile,
  getMentorProfileById,
  getMyMentorProfile,
  getAllMentorProfiles,
  setMentorFeatured,
} = require('../controllers/mentorProfile.controller');
const { headshotUpload } = require('../middleware/uploadHeadshot');

// Create/update mentor profile
router.post('/profile', authenticate, ...headshotUpload('mentors'), createOrUpdateMentorProfile);
// Get all mentor profiles (public). Optional ?featured=true
router.get('/profiles', getAllMentorProfiles);
// Admin: toggle featured (max 10)
router.patch('/profiles/:id/featured', authenticate, requireAdmin, setMentorFeatured);
// Get public mentor profile
router.get('/profile/:id', getMentorProfileById);
// Get logged-in mentor's profile
router.get('/my-profile', authenticate, getMyMentorProfile);

module.exports = router;
