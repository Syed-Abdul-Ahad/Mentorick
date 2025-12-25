const express = require('express');
const { 
  createMegaSession, 
  getMegaSessions, 
  joinMegaSession 
} = require('../controllers/booking.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin routes
router.post('/create', authenticate, requireAdmin, createMegaSession);

// Public/mentee routes
router.get('/list', authenticate, getMegaSessions);
router.post('/:megaSessionId/join', authenticate, joinMegaSession);

module.exports = router;