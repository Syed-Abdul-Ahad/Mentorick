const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validation');
const {
  getMentors,
  getMentor,
  createMentorProfile,
  updateMentorProfile,
  deleteMentorProfile,
  getMentorDashboard,
  getMentorAvailability,
  updateMentorAvailability,
  getMentorStats,
} = require('../controllers/mentorController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get mentor statistics (Admin only)
// @route   GET /api/mentors/stats
// @access  Private/Admin
router.get('/stats', authenticate, authorize('admin'), getMentorStats);

// @desc    Get mentor dashboard (Mentor only)
// @route   GET /api/mentors/dashboard
// @access  Private/Mentor
router.get('/dashboard', authenticate, authorize('mentor'), getMentorDashboard);

// @desc    Get all mentors
// @route   GET /api/mentors
// @access  Public
router.get('/', optionalAuth, getMentors);

// @desc    Create mentor profile
// @route   POST /api/mentors
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('expertise')
      .isArray({ min: 1 })
      .withMessage('At least one area of expertise is required'),
    body('expertise.*')
      .trim()
      .notEmpty()
      .withMessage('Expertise areas cannot be empty'),
    body('experience')
      .isInt({ min: 0, max: 50 })
      .withMessage('Experience must be between 0 and 50 years'),
    body('pricing.hourlyRate')
      .isFloat({ min: 0 })
      .withMessage('Hourly rate must be a positive number'),
    body('availability.timezone')
      .notEmpty()
      .withMessage('Timezone is required'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    body('languages')
      .optional()
      .isArray()
      .withMessage('Languages must be an array'),
  ],
  validateRequest,
  createMentorProfile
);

// @desc    Get single mentor
// @route   GET /api/mentors/:id
// @access  Public
router.get('/:id', optionalAuth, getMentor);

// @desc    Update mentor profile
// @route   PUT /api/mentors/:id
// @access  Private
router.put(
  '/:id',
  authenticate,
  [
    body('expertise')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one area of expertise is required'),
    body('expertise.*')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Expertise areas cannot be empty'),
    body('experience')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Experience must be between 0 and 50 years'),
    body('pricing.hourlyRate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Hourly rate must be a positive number'),
    body('availability.timezone')
      .optional()
      .notEmpty()
      .withMessage('Timezone cannot be empty'),
  ],
  validateRequest,
  updateMentorProfile
);

// @desc    Delete mentor profile
// @route   DELETE /api/mentors/:id
// @access  Private
router.delete('/:id', authenticate, deleteMentorProfile);

// @desc    Get mentor availability
// @route   GET /api/mentors/:id/availability
// @access  Public
router.get('/:id/availability', getMentorAvailability);

// @desc    Update mentor availability
// @route   PUT /api/mentors/:id/availability
// @access  Private/Mentor
router.put(
  '/:id/availability',
  authenticate,
  authorize('mentor'),
  [
    body('timezone')
      .optional()
      .notEmpty()
      .withMessage('Timezone cannot be empty'),
    body('weeklySchedule')
      .optional()
      .isArray()
      .withMessage('Weekly schedule must be an array'),
    body('unavailableDates')
      .optional()
      .isArray()
      .withMessage('Unavailable dates must be an array'),
  ],
  validateRequest,
  updateMentorAvailability
);

module.exports = router;
