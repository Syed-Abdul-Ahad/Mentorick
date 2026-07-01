const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const MenteeProfile = require('../models/MenteeProfile');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmailWithResend = require('../utils/email');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();

  // Cookie options
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', token, options).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'mentee',
    });

    // Generate email verification token (you can implement email service later)
    // const emailVerificationToken = user.createEmailVerificationToken();
    // await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    if (!user.password && user.googleId) {
      return res.status(401).json({
        status: 'error',
        message: 'This account uses Google sign in. Please continue with Google.',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'User logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'mentor') {
      const mentorProfile = await MentorProfile.findOne({ user: user._id });
      user.profile = mentorProfile;  
    } 
    else if (user.role === 'mentee') {
      const menteeProfile = await MenteeProfile.findOne({ user: user._id });
      user.profile = menteeProfile;  
    }
    else {
      user.profile = null;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: "We couldn't find a user with that email",
      });
    }

    // 1️⃣ Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 2️⃣ Frontend reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    // 3️⃣ Send email via Resend
    try {
      const option = {
        email: user.email,
        subject: '🔐 Password Reset Request',
        isForgotPassword: true,
        resetUrl,
        firstName: user.firstName || 'User',
        message: `
          We received a request to reset your password.

          Click the link below to reset it:
          ${resetUrl}

          This link is valid for 10 minutes.
        `,
      }
      await sendEmailWithResend(option);

      res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'error',
        message: 'There was an error sending the email. Try again later.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    // 1️⃣ Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // 2️⃣ Find valid user
    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired',
      });
    }

    // 3️⃣ Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    // 4️⃣ Auto login
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};


// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const verificationToken = req.params.token;

    const user = await User.findOne({
      emailVerificationToken: verificationToken,
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification token',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
