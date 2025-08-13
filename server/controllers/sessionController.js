const Session = require('../models/Session');
const Mentor = require('../models/Mentor');
const Review = require('../models/Review');

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
const getSessions = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Base filter
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'mentor') {
      const mentor = await Mentor.findOne({ user: req.user.id });
      if (!mentor) {
        return res.status(404).json({
          status: 'error',
          message: 'Mentor profile not found',
        });
      }
      filter.mentor = mentor._id;
    } else if (req.user.role === 'user') {
      filter.mentee = req.user.id;
    }
    // Admin can see all sessions (no additional filter)

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.scheduledDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    // Sorting
    let sort = { scheduledDate: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'date-asc':
          sort = { scheduledDate: 1 };
          break;
        case 'date-desc':
          sort = { scheduledDate: -1 };
          break;
        case 'created':
          sort = { createdAt: -1 };
          break;
      }
    }

    const sessions = await Session.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('mentor', 'user expertise rating')
      .populate('mentee', 'firstName lastName email avatar');

    const total = await Session.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: sessions.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: {
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
const getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('mentor', 'user expertise rating availability')
      .populate('mentee', 'firstName lastName email avatar profile');

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Check if user has access to this session
    const mentor = await Mentor.findById(session.mentor._id);
    const hasAccess = 
      req.user.role === 'admin' ||
      session.mentee._id.toString() === req.user.id ||
      (mentor && mentor.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new session
// @route   POST /api/sessions
// @access  Private
const createSession = async (req, res, next) => {
  try {
    const {
      mentorId,
      title,
      description,
      objectives,
      scheduledDate,
      duration,
      meetingPlatform,
    } = req.body;

    // Get mentor info
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found',
      });
    }

    // Check if mentor is active
    if (!mentor.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor is not currently active',
      });
    }

    // Check if the scheduled time is in the future
    if (new Date(scheduledDate) <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Session must be scheduled in the future',
      });
    }

    // Check for conflicting sessions
    const existingSession = await Session.findOne({
      mentor: mentorId,
      scheduledDate: {
        $gte: new Date(scheduledDate),
        $lt: new Date(new Date(scheduledDate).getTime() + duration * 60000),
      },
      status: { $in: ['scheduled', 'in-progress'] },
    });

    if (existingSession) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor is not available at this time',
      });
    }

    // Calculate pricing
    const hourlyRate = mentor.pricing.hourlyRate;
    const totalAmount = (duration / 60) * hourlyRate;

    const session = await Session.create({
      mentor: mentorId,
      mentee: req.user.id,
      title,
      description,
      objectives,
      scheduledDate,
      duration,
      meetingPlatform,
      pricing: {
        hourlyRate,
        totalAmount,
        currency: mentor.pricing.currency,
      },
    });

    const populatedSession = await Session.findById(session._id)
      .populate('mentor', 'user expertise rating')
      .populate('mentee', 'firstName lastName email avatar');

    res.status(201).json({
      status: 'success',
      data: {
        session: populatedSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private
const updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Check if user has permission to update
    const mentor = await Mentor.findById(session.mentor);
    const canUpdate = 
      req.user.role === 'admin' ||
      session.mentee.toString() === req.user.id ||
      (mentor && mentor.user.toString() === req.user.id);

    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Prevent updating completed or cancelled sessions
    if (['completed', 'cancelled'].includes(session.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update completed or cancelled sessions',
      });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('mentor', 'user expertise rating')
      .populate('mentee', 'firstName lastName email avatar');

    res.status(200).json({
      status: 'success',
      data: {
        session: updatedSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
const cancelSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Check if user has permission to cancel
    const mentor = await Mentor.findById(session.mentor);
    const canCancel = 
      req.user.role === 'admin' ||
      session.mentee.toString() === req.user.id ||
      (mentor && mentor.user.toString() === req.user.id);

    if (!canCancel) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Check if session can be cancelled
    if (['completed', 'cancelled'].includes(session.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Session is already completed or cancelled',
      });
    }

    // Check cancellation policy (e.g., 24 hours before)
    const hoursUntilSession = (new Date(session.scheduledDate) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilSession < 24) {
      return res.status(400).json({
        status: 'error',
        message: 'Sessions can only be cancelled 24 hours in advance',
      });
    }

    session.status = 'cancelled';
    session.cancellationReason = req.body.reason || 'No reason provided';
    session.cancelledBy = req.user.id;
    session.cancelledAt = new Date();

    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Session cancelled successfully',
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start session
// @route   PUT /api/sessions/:id/start
// @access  Private
const startSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Only mentor can start the session
    const mentor = await Mentor.findById(session.mentor);
    if (!mentor || mentor.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the mentor can start the session',
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        status: 'error',
        message: 'Session cannot be started',
      });
    }

    session.status = 'in-progress';
    session.actualStartTime = new Date();
    if (req.body.meetingLink) {
      session.meetingLink = req.body.meetingLink;
    }

    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Session started successfully',
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete session
// @route   PUT /api/sessions/:id/complete
// @access  Private
const completeSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Only mentor can complete the session
    const mentor = await Mentor.findById(session.mentor);
    if (!mentor || mentor.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the mentor can complete the session',
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Session is not in progress',
      });
    }

    session.status = 'completed';
    session.actualEndTime = new Date();
    session.pricing.paymentStatus = 'paid'; // In real app, integrate with payment gateway

    // Update mentor stats
    mentor.totalSessions += 1;
    mentor.totalRevenue += session.pricing.totalAmount;
    await mentor.save();

    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Session completed successfully',
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add session feedback
// @route   POST /api/sessions/:id/feedback
// @access  Private
const addSessionFeedback = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only provide feedback for completed sessions',
      });
    }

    const { rating, comment } = req.body;

    // Check if user is mentor or mentee
    const mentor = await Mentor.findById(session.mentor);
    const isMentor = mentor && mentor.user.toString() === req.user.id;
    const isMentee = session.mentee.toString() === req.user.id;

    if (!isMentor && !isMentee) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
    }

    // Add feedback
    if (isMentor) {
      session.feedback.mentorFeedback = {
        rating,
        comment,
        submittedAt: new Date(),
      };
    } else {
      session.feedback.menteeFeedback = {
        rating,
        comment,
        submittedAt: new Date(),
      };

      // Create review for mentee feedback
      const existingReview = await Review.findOne({
        session: session._id,
        mentee: req.user.id,
      });

      if (!existingReview) {
        await Review.create({
          session: session._id,
          mentor: session.mentor,
          mentee: req.user.id,
          rating,
          comment,
        });

        // Update mentor rating
        const reviews = await Review.find({ mentor: session.mentor });
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        mentor.rating.average = avgRating;
        mentor.rating.count = reviews.length;
        await mentor.save();
      }
    }

    await session.save();

    res.status(200).json({
      status: 'success',
      message: 'Feedback added successfully',
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session statistics
// @route   GET /api/sessions/stats
// @access  Private/Admin
const getSessionStats = async (req, res, next) => {
  try {
    const totalSessions = await Session.countDocuments();
    
    const statusStats = await Session.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyRevenue = await Session.aggregate([
      {
        $match: {
          'pricing.paymentStatus': 'paid',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$scheduledDate' },
            month: { $month: '$scheduledDate' },
          },
          revenue: { $sum: '$pricing.totalAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalSessions,
        statusStats,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getSession,
  createSession,
  updateSession,
  cancelSession,
  startSession,
  completeSession,
  addSessionFeedback,
  getSessionStats,
};
