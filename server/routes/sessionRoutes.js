const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validation');
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  cancelSession,
  startSession,
  completeSession,
  addSessionFeedback,
  getSessionStats,
} = require('../controllers/sessionController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get session statistics (Admin only)
// @route   GET /api/sessions/stats
// @access  Private/Admin
router.get('/stats', authenticate, authorize('admin'), getSessionStats);

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
router.get('/', authenticate, getSessions);

// @desc    Create new session
// @route   POST /api/sessions
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('mentorId')
      .isMongoId()
      .withMessage('Valid mentor ID is required'),
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('scheduledDate')
      .isISO8601()
      .toDate()
      .withMessage('Valid scheduled date is required'),
    body('duration')
      .isInt({ min: 15, max: 480 })
      .withMessage('Duration must be between 15 and 480 minutes'),
    body('meetingPlatform')
      .optional()
      .isIn(['zoom', 'google-meet', 'microsoft-teams', 'skype', 'discord', 'other'])
      .withMessage('Invalid meeting platform'),
    body('objectives')
      .optional()
      .isArray()
      .withMessage('Objectives must be an array'),
  ],
  validateRequest,
  createSession
);

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
router.get('/:id', authenticate, getSession);

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private
router.put(
  '/:id',
  authenticate,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Valid scheduled date is required'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage('Duration must be between 15 and 480 minutes'),
    body('meetingPlatform')
      .optional()
      .isIn(['zoom', 'google-meet', 'microsoft-teams', 'skype', 'discord', 'other'])
      .withMessage('Invalid meeting platform'),
  ],
  validateRequest,
  updateSession
);

// @desc    Cancel session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
router.put(
  '/:id/cancel',
  authenticate,
  [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason cannot exceed 500 characters'),
  ],
  validateRequest,
  cancelSession
);

// @desc    Start session (Mentor only)
// @route   PUT /api/sessions/:id/start
// @access  Private/Mentor
router.put(
  '/:id/start',
  authenticate,
  [
    body('meetingLink')
      .optional()
      .isURL()
      .withMessage('Meeting link must be a valid URL'),
  ],
  validateRequest,
  startSession
);

// @desc    Complete session (Mentor only)
// @route   PUT /api/sessions/:id/complete
// @access  Private/Mentor
router.put('/:id/complete', authenticate, completeSession);

// @desc    Add session feedback
// @route   POST /api/sessions/:id/feedback
// @access  Private
router.post(
  '/:id/feedback',
  authenticate,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10 and 1000 characters'),
  ],
  validateRequest,
  addSessionFeedback
);

module.exports = router;
