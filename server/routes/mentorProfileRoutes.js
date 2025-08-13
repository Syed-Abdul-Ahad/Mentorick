const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createOrUpdateMentorProfile, getMentorProfileById, getMyMentorProfile } = require('../controllers/mentorProfile.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for mentor headshot uploads
const uploadDir = path.join(__dirname, '../uploads/mentors');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Create/update mentor profile
router.post('/profile', authenticate, upload.single('headshot'), createOrUpdateMentorProfile);
// Get public mentor profile
router.get('/profile/:id', getMentorProfileById);
// Get logged-in mentor's profile
router.get('/my-profile', authenticate, getMyMentorProfile);

module.exports = router;
