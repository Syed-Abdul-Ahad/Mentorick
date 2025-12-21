const { 
  createBooking, 
  getMyBookings, 
  getBookingAnalytics 
} = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

const express = require('express');
const router = express.Router();

router.post('/create', authenticate, createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/analytics', authenticate, getBookingAnalytics);

module.exports = router;