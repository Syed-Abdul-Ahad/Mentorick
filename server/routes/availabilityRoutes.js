const express = require('express');
const {
  getMentorAvailability,
  getAvailableSlots,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getMyAvailability,
} = require('../controllers/availabilityController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:mentorId', getMentorAvailability);
router.get('/:mentorId/slots', getAvailableSlots);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/my/availability', getMyAvailability);
router.post('/', createAvailability);
router.put('/:id', updateAvailability);
router.delete('/:id', deleteAvailability);

module.exports = router;
