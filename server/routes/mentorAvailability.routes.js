const express = require('express');
const router = express.Router();

const {
  setWeeklyAvailability,
  setDateAvailability,
  setUnavailability,
  getMentorAvailabilityForMentee,
  getMyAvailability
} = require('../controllers/availability.controller');
const { authenticate } = require('../middleware/auth');

/* Mentor routes */
router.get('/my-availability', authenticate, getMyAvailability);
router.post('/weekly', authenticate, setWeeklyAvailability);
router.post('/date', authenticate, setDateAvailability);
router.post('/unavailable', authenticate,setUnavailability);

/* Mentee route */
router.get('/:mentorId', getMentorAvailabilityForMentee);

module.exports = router;
