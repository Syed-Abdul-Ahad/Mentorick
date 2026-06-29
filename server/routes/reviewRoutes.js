const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createReview,
  getMentorReviews,
  getMentorReviewStats,
} = require('../controllers/review.controller');

const router = express.Router();

router.get('/mentor/:mentorId/stats', getMentorReviewStats);
router.get('/mentor/:mentorId', getMentorReviews);
router.post('/', authenticate, createReview);

module.exports = router;
