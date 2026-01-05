const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validation');
const {
  getUsers,
  getUser,
  deleteUser,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
// router.get('/profile', authenticate, getProfile);

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
// router.put(
//   '/profile',
//   authenticate,
//   [
//     body('firstName')
//       .optional()
//       .trim()
//       .isLength({ min: 2, max: 50 })
//       .withMessage('First name must be between 2 and 50 characters'),
//     body('lastName')
//       .optional()
//       .trim()
//       .isLength({ min: 2, max: 50 })
//       .withMessage('Last name must be between 2 and 50 characters'),
//     body('profile.bio')
//       .optional()
//       .trim()
//       .isLength({ max: 500 })
//       .withMessage('Bio cannot exceed 500 characters'),
//     body('profile.phoneNumber')
//       .optional()
//       .matches(/^\+?[\d\s-()]+$/)
//       .withMessage('Please provide a valid phone number'),
//   ],
//   validateRequest,
//   updateProfile
// );

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
// router.post('/avatar', authenticate, uploadAvatar);

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
// router.get('/stats', authenticate, authorize('admin'), getUserStats);

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), getUsers);

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', authenticate, getUser);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
// router.put(
//   '/:id',
//   authenticate,
//   [
//     body('firstName')
//       .optional()
//       .trim()
//       .isLength({ min: 2, max: 50 })
//       .withMessage('First name must be between 2 and 50 characters'),
//     body('lastName')
//       .optional()
//       .trim()
//       .isLength({ min: 2, max: 50 })
//       .withMessage('Last name must be between 2 and 50 characters'),
//     body('email')
//       .optional()
//       .isEmail()
//       .normalizeEmail()
//       .withMessage('Please provide a valid email'),
//     body('role')
//       .optional()
//       .isIn(['user', 'mentor', 'admin'])
//       .withMessage('Role must be user, mentor, or admin'),
//     body('profile.bio')
//       .optional()
//       .trim()
//       .isLength({ max: 500 })
//       .withMessage('Bio cannot exceed 500 characters'),
//     body('profile.phoneNumber')
//       .optional()
//       .matches(/^\+?[\d\s-()]+$/)
//       .withMessage('Please provide a valid phone number'),
//   ],
//   validateRequest,
//   updateUser
// );

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;
