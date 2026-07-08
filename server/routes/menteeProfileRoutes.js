const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createOrUpdateMenteeProfile, getMenteeProfileById, getMyMenteeProfile } = require('../controllers/menteeProfile.controller');
const { headshotUpload } = require('../middleware/uploadHeadshot');

// Create/update mentee profile
router.post('/profile', authenticate, ...headshotUpload('mentees'), createOrUpdateMenteeProfile);
// Get public mentee profile
router.get('/profile/:id', getMenteeProfileById);
// Get logged-in mentee's profile
router.get('/my-profile', authenticate, getMyMenteeProfile);

module.exports = router;
