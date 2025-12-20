const { createBooking } = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

const express = require('express');
const router = express.Router();

router.post('/create', authenticate, createBooking);

module.exports = router;