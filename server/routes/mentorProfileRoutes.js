const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createOrUpdateMentorProfile, getMentorProfileById, getMyMentorProfile, getAllMentorProfiles } = require('../controllers/mentorProfile.controller');
const { headshotUpload } = require('../middleware/uploadHeadshot');

// Create/update mentor profile
router.post('/profile', authenticate, ...headshotUpload('mentors'), createOrUpdateMentorProfile);
// Get all mentor profiles (public)
router.get('/profiles', getAllMentorProfiles);
// Get public mentor profile
router.get('/profile/:id', getMentorProfileById);
// Get logged-in mentor's profile
router.get('/my-profile', authenticate, getMyMentorProfile);

module.exports = router;
