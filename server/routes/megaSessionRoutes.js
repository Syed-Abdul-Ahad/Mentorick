const express = require('express');
const {
  createMegaSession,
  getAllMegaSessions,
  getMegaSession,
  joinMegaSession,
  leaveMegaSession,
  updateMegaSessionStatus,
  getMentorMegaSessions,
} = require('../controllers/megaSessionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllMegaSessions);
router.get('/:id', getMegaSession);

// Protected routes
router.use(authenticate);

// Admin routes
router.post('/', createMegaSession);
router.put('/:id/status', updateMegaSessionStatus);

// User routes
router.put('/:id/join', joinMegaSession);
router.put('/:id/leave', leaveMegaSession);

// Mentor routes
router.get('/mentor/my-sessions', getMentorMegaSessions);

module.exports = router;
