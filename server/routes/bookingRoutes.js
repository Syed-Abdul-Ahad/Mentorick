const { 
  createBooking, 
  getMyBookings, 
  getBookingAnalytics,
  getPaymentHistory,
  getDurationOptions,
} = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

const express = require('express');
const router = express.Router();

router.get('/duration-options', getDurationOptions);
router.post('/create', authenticate, createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/analytics', authenticate, getBookingAnalytics);
router.get('/payment-history', authenticate, getPaymentHistory);

module.exports = router;