const MegaSession = require('../models/MegaSession');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

// @desc    Create a new mega session (Admin only)
// @route   POST /api/mega-sessions
// @access  Private (Admin only)
const createMegaSession = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can create mega sessions',
      });
    }

    const {
      title,
      description,
      mentorId, // This is the user ID
      scheduledDate,
      startTime,
      duration,
      maxParticipants = 20,
      price = 0,
      currency = 'USD',
      meetingPlatform = 'zoom',
    } = req.body;

    // Find mentor profile using user ID
    const mentorProfile = await MentorProfile.findOne({ user: mentorId }).populate('user');
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const endTime = minutesToTime(endMinutes);

    // Check for conflicts with existing mega sessions
    const conflictingSession = await MegaSession.findOne({
      mentor: mentorProfile._id,
      scheduledDate: new Date(scheduledDate),
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ],
      status: { $nin: ['cancelled'] }
    });

    if (conflictingSession) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor has a conflicting session at this time',
      });
    }

    const megaSessionData = {
      title,
      description,
      mentor: mentorProfile._id,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      duration,
      maxParticipants,
      price,
      currency,
      meetingPlatform,
      mentorTimezone: mentorProfile.timezone || 'UTC',
      createdBy: req.user.id,
    };

    const megaSession = await MegaSession.create(megaSessionData);

    // Populate the created session
    await megaSession.populate([
      {
        path: 'mentor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      },
      {
        path: 'createdBy',
        select: 'firstName lastName email'
      }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        megaSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all mega sessions
// @route   GET /api/mega-sessions
// @access  Public
const getAllMegaSessions = async (req, res, next) => {
  try {
    const { status, upcoming = 'false', mentorId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Upcoming filter
    if (upcoming === 'true') {
      filter.scheduledDate = { $gte: new Date() };
    }

    // Mentor filter
    if (mentorId) {
      const mentorProfile = await MentorProfile.findOne({ user: mentorId });
      if (mentorProfile) {
        filter.mentor = mentorProfile._id;
      }
    }

    const megaSessions = await MegaSession.find(filter)
      .populate([
        {
          path: 'mentor',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        },
        {
          path: 'participants.user',
          select: 'firstName lastName email'
        },
        {
          path: 'createdBy',
          select: 'firstName lastName email'
        }
      ])
      .sort({ scheduledDate: -1 })
      .limit(limit)
      .skip(skip);

    const total = await MegaSession.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        megaSessions,
        pagination: {
          page,
          pages,
          limit,
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific mega session details
// @route   GET /api/mega-sessions/:id
// @access  Public
const getMegaSession = async (req, res, next) => {
  try {
    const megaSession = await MegaSession.findById(req.params.id)
      .populate([
        {
          path: 'mentor',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        },
        {
          path: 'participants.user',
          select: 'firstName lastName email'
        },
        {
          path: 'createdBy',
          select: 'firstName lastName email'
        }
      ]);

    if (!megaSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Mega session not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        megaSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a mega session
// @route   PUT /api/mega-sessions/:id/join
// @access  Private
const joinMegaSession = async (req, res, next) => {
  try {
    const megaSession = await MegaSession.findById(req.params.id);
    
    if (!megaSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Mega session not found',
      });
    }

    if (megaSession.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot join a cancelled session',
      });
    }

    if (megaSession.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot join a completed session',
      });
    }

    // Check if session is full
    if (megaSession.participants.length >= megaSession.maxParticipants) {
      return res.status(400).json({
        status: 'error',
        message: 'Session is full',
      });
    }

    // Check if user is already a participant
    const existingParticipant = megaSession.participants.find(
      p => p.user.toString() === req.user.id.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already registered for this session',
      });
    }

    // Add participant
    megaSession.participants.push({ user: req.user.id });
    await megaSession.save();

    await megaSession.populate([
      {
        path: 'mentor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      },
      {
        path: 'participants.user',
        select: 'firstName lastName email'
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        megaSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a mega session
// @route   PUT /api/mega-sessions/:id/leave
// @access  Private
const leaveMegaSession = async (req, res, next) => {
  try {
    const megaSession = await MegaSession.findById(req.params.id);
    
    if (!megaSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Mega session not found',
      });
    }

    // Remove participant
    megaSession.participants = megaSession.participants.filter(
      p => p.user.toString() !== req.user.id.toString()
    );

    await megaSession.save();

    res.status(200).json({
      status: 'success',
      message: 'Successfully left the session',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mega session status (Admin only)
// @route   PUT /api/mega-sessions/:id/status
// @access  Private (Admin only)
const updateMegaSessionStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update session status',
      });
    }

    const { status, meetingLink } = req.body;

    const megaSession = await MegaSession.findById(req.params.id);
    if (!megaSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Mega session not found',
      });
    }

    // Validate status
    const validStatuses = ['scheduled', 'active', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status',
      });
    }

    // Update session
    if (status) megaSession.status = status;
    if (meetingLink) megaSession.meetingLink = meetingLink;

    await megaSession.save();

    await megaSession.populate([
      {
        path: 'mentor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      },
      {
        path: 'participants.user',
        select: 'firstName lastName email'
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        megaSession,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentor's mega sessions
// @route   GET /api/mega-sessions/mentor/my-sessions
// @access  Private (Mentor only)
const getMentorMegaSessions = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only mentors can access this endpoint',
      });
    }

    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    const megaSessions = await MegaSession.find({
      mentor: mentorProfile._id,
    })
    .populate([
      {
        path: 'participants.user',
        select: 'firstName lastName email'
      },
      {
        path: 'createdBy',
        select: 'firstName lastName email'
      }
    ])
    .sort({ scheduledDate: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        megaSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

module.exports = {
  createMegaSession,
  getAllMegaSessions,
  getMegaSession,
  joinMegaSession,
  leaveMegaSession,
  updateMegaSessionStatus,
  getMentorMegaSessions,
};
