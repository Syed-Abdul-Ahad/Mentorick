const Mentor = require('../models/Mentor');
const User = require('../models/User');
const Session = require('../models/Session');
const Review = require('../models/Review');

// @desc    Get all mentors
// @route   GET /api/mentors
// @access  Public
const getMentors = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    let filter = { isActive: true };
    
    if (req.query.expertise) {
      filter.expertise = { $in: req.query.expertise.split(',') };
    }
    
    if (req.query.minRate) {
      filter['pricing.hourlyRate'] = { $gte: parseFloat(req.query.minRate) };
    }
    
    if (req.query.maxRate) {
      filter['pricing.hourlyRate'] = { 
        ...filter['pricing.hourlyRate'],
        $lte: parseFloat(req.query.maxRate) 
      };
    }
    
    if (req.query.minRating) {
      filter['rating.average'] = { $gte: parseFloat(req.query.minRating) };
    }
    
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }

    if (req.query.languages) {
      filter['languages.language'] = { $in: req.query.languages.split(',') };
    }

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { expertise: searchRegex },
        { 'skills.name': searchRegex },
      ];
    }

    // Sorting
    let sort = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        case 'price-low':
          sort = { 'pricing.hourlyRate': 1 };
          break;
        case 'price-high':
          sort = { 'pricing.hourlyRate': -1 };
          break;
        case 'experience':
          sort = { experience: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        default:
          sort = { 'rating.average': -1 };
      }
    } else {
      sort = { 'rating.average': -1 };
    }

    const mentors = await Mentor.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName avatar profile.bio profile.location');

    const total = await Mentor.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: mentors.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: {
        mentors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mentor
// @route   GET /api/mentors/:id
// @access  Public
const getMentor = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar profile isEmailVerified');

    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found',
      });
    }

    // Get recent reviews
    const reviews = await Review.find({ mentor: mentor._id, isPublic: true })
      .populate('mentee', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        mentor,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create mentor profile
// @route   POST /api/mentors
// @access  Private
const createMentorProfile = async (req, res, next) => {
  try {
    // Check if user already has a mentor profile
    const existingMentor = await Mentor.findOne({ user: req.user.id });
    if (existingMentor) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor profile already exists',
      });
    }

    // Update user role to mentor
    await User.findByIdAndUpdate(req.user.id, { role: 'mentor' });

    const mentor = await Mentor.create({
      user: req.user.id,
      ...req.body,
    });

    const populatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'firstName lastName email avatar profile');

    res.status(201).json({
      status: 'success',
      data: {
        mentor: populatedMentor,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mentor profile
// @route   PUT /api/mentors/:id
// @access  Private
const updateMentorProfile = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id);

    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found',
      });
    }

    // Check if user owns this mentor profile or is admin
    if (mentor.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    const updatedMentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('user', 'firstName lastName email avatar profile');

    res.status(200).json({
      status: 'success',
      data: {
        mentor: updatedMentor,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete mentor profile
// @route   DELETE /api/mentors/:id
// @access  Private
const deleteMentorProfile = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id);

    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found',
      });
    }

    // Check if user owns this mentor profile or is admin
    if (mentor.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Soft delete - deactivate mentor instead of removing
    mentor.isActive = false;
    await mentor.save();

    // Update user role back to user
    await User.findByIdAndUpdate(mentor.user, { role: 'user' });

    res.status(200).json({
      status: 'success',
      message: 'Mentor profile deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentor's dashboard data
// @route   GET /api/mentors/dashboard
// @access  Private (Mentor only)
const getMentorDashboard = async (req, res, next) => {
  try {
    const mentor = await Mentor.findOne({ user: req.user.id });

    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    // Get upcoming sessions
    const upcomingSessions = await Session.find({
      mentor: mentor._id,
      scheduledDate: { $gte: new Date() },
      status: 'scheduled',
    })
      .populate('mentee', 'firstName lastName avatar')
      .sort({ scheduledDate: 1 })
      .limit(5);

    // Get recent sessions
    const recentSessions = await Session.find({
      mentor: mentor._id,
      status: 'completed',
    })
      .populate('mentee', 'firstName lastName avatar')
      .sort({ scheduledDate: -1 })
      .limit(5);

    // Get monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyStats = await Session.aggregate([
      {
        $match: {
          mentor: mentor._id,
          scheduledDate: {
            $gte: currentMonth,
            $lt: nextMonth,
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
        },
      },
    ]);

    // Get pending reviews
    const pendingReviews = await Session.find({
      mentor: mentor._id,
      status: 'completed',
      'feedback.menteeFeedback.rating': { $exists: true },
      'feedback.mentorFeedback.rating': { $exists: false },
    })
      .populate('mentee', 'firstName lastName avatar')
      .sort({ scheduledDate: -1 })
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        mentor,
        upcomingSessions,
        recentSessions,
        monthlyStats,
        pendingReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentor availability
// @route   GET /api/mentors/:id/availability
// @access  Public
const getMentorAvailability = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id).select('availability');

    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found',
      });
    }

    // Get booked sessions for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const bookedSessions = await Session.find({
      mentor: mentor._id,
      scheduledDate: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $in: ['scheduled', 'in-progress'] },
    }).select('scheduledDate duration');

    res.status(200).json({
      status: 'success',
      data: {
        availability: mentor.availability,
        bookedSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mentor availability
// @route   PUT /api/mentors/:id/availability
// @access  Private (Mentor only)
const updateMentorAvailability = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id);

    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found',
      });
    }

    // Check if user owns this mentor profile
    if (mentor.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    mentor.availability = { ...mentor.availability, ...req.body };
    await mentor.save();

    res.status(200).json({
      status: 'success',
      data: {
        availability: mentor.availability,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentor statistics
// @route   GET /api/mentors/stats
// @access  Private/Admin
const getMentorStats = async (req, res, next) => {
  try {
    const totalMentors = await Mentor.countDocuments();
    const activeMentors = await Mentor.countDocuments({ isActive: true });
    const verifiedMentors = await Mentor.countDocuments({ isVerified: true });

    const expertiseStats = await Mentor.aggregate([
      { $unwind: '$expertise' },
      { $group: { _id: '$expertise', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalMentors,
        activeMentors,
        verifiedMentors,
        expertiseStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMentors,
  getMentor,
  createMentorProfile,
  updateMentorProfile,
  deleteMentorProfile,
  getMentorDashboard,
  getMentorAvailability,
  updateMentorAvailability,
  getMentorStats,
};
