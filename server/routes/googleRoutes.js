const express = require('express');
const {
  googleAuth,
  googleCallback,
  getGoogleStatus
} = require('../controllers/googleController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/google', authenticate, googleAuth);
router.get('/google/callback', googleCallback);
router.get('/google/status', authenticate, getGoogleStatus);

module.exports = router;