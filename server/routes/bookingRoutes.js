const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus,
  getMentorUpcomingSessions,
} = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// General booking routes
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/mentor/upcoming', getMentorUpcomingSessions);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
