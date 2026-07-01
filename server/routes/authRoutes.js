const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validation');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require('../controllers/authController');
const {
  googleLogin,
  googleLoginCallback,
} = require('../controllers/googleAuthController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Google OAuth login/signup (separate from mentor calendar OAuth at /auth/google)
router.get('/google/login', googleLogin);
router.get('/google/callback', googleLoginCallback);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  '/register',
  [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
      .optional()
      .isIn(['user', 'mentor'])
      .withMessage('Role must be either user or mentor'),
  ],
  validateRequest,
  register
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validateRequest,
  login
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, logout);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, getMe);

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put(
  '/updatedetails',
  authenticate,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  validateRequest,
  updateDetails
);

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put(
  '/updatepassword',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validateRequest,
  updatePassword
);

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post(
  '/forgotpassword',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
  ],
  validateRequest,
  forgotPassword
);

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put(
  '/resetpassword/:resettoken',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validateRequest,
  resetPassword
);

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
router.get('/verify/:token', verifyEmail);

module.exports = router;
