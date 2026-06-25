const express = require('express');
const {
  createMegaSession,
  getMegaSessions,
  getPendingMegaSessions,
  acceptMegaSession,
  rejectMegaSession,
  joinMegaSession,
} = require('../controllers/booking.controller');
const { authenticate, requireAdmin, requireMentor } = require('../middleware/auth');

const router = express.Router();

// Admin routes
router.post('/create', authenticate, requireAdmin, createMegaSession);

// Mentor routes (must be before /:megaSessionId param routes)
router.get('/pending', authenticate, requireMentor, getPendingMegaSessions);
router.post('/:megaSessionId/accept', authenticate, requireMentor, acceptMegaSession);
router.post('/:megaSessionId/reject', authenticate, requireMentor, rejectMegaSession);

// Public/mentee routes
router.get('/list', authenticate, getMegaSessions);
router.post('/:megaSessionId/join', authenticate, joinMegaSession);

module.exports = router;
