const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createOrUpdateMenteeProfile, getMenteeProfileById, getMyMenteeProfile } = require('../controllers/menteeProfile.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for mentee headshot uploads
const uploadDir = path.join(__dirname, '../uploads/mentees');
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

// Create/update mentee profile
router.post('/profile', authenticate, upload.single('headshot'), createOrUpdateMenteeProfile);
// Get public mentee profile
router.get('/profile/:id', getMenteeProfileById);
// Get logged-in mentee's profile
router.get('/my-profile', authenticate, getMyMenteeProfile);

module.exports = router;
