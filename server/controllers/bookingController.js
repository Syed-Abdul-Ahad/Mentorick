const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const MentorProfile = require('../models/MentorProfile');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Mentee only)
const createBooking = async (req, res, next) => {
  try {
    const {
      mentorId, // This is actually the user ID from frontend
      availabilityId,
      scheduledDate,
      startTime,
      duration,
      notes,
      menteeTimezone = 'UTC',
    } = req.body;

    // Validate duration
    const validDurations = [30, 60, 90];
    if (!validDurations.includes(duration)) {
      return res.status(400).json({
        status: 'error',
        message: 'Duration must be 30, 60, or 90 minutes',
      });
    }
    // Find mentor profile using user ID
    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    // Verify availability exists and belongs to this mentor
    const availability = await Availability.findById(availabilityId);
    if (!availability || availability.mentor.toString() !== mentorProfile._id.toString()) {
      return res.status(404).json({
        status: 'error',
        message: 'Availability slot not found',
      });
    }

    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    const endTime = minutesToTime(endMinutes);

    // Check if slot is available using mentorProfile._id
    const isAvailable = await Booking.isSlotAvailable(
      mentorProfile._id,
      new Date(scheduledDate),
      startTime,
      endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'This time slot is no longer available',
      });
    }

    const mentorTimezone = mentorProfile?.timezone || 'UTC';

    const bookingData = {
      mentor: mentorProfile._id, // Use mentorProfile document ID
      mentee: req.user.id,
      availability: availabilityId,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime, // Include calculated endTime
      duration,
      sessionType: '1:1', // Always 1:1
      notes,
      mentorTimezone,
      menteeTimezone,
      maxParticipants: 1, // Always 1 for 1:1 sessions
    };

    // Create 1:1 session
    const booking = await Booking.create(bookingData);

    // Populate booking with mentor and mentee details
    await booking.populate([
      {
        path: 'mentor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      },
      {
        path: 'mentee',
        select: 'firstName lastName email'
      }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookings (mentee or mentor)
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const { status, upcoming = 'false' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};

    // Role-based filtering
    if (req.user.role === 'mentor') {
      const mentor = await MentorProfile.findOne({ user: req.user.id });
      if (!mentor) {
        return res.status(404).json({
          status: 'error',
          message: 'Mentor profile not found',
        });
      }
      filter.mentor = mentor._id;
    } else {
      // For mentees, show only their bookings
      filter.mentee = req.user.id;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Upcoming filter
    if (upcoming === 'true') {
      filter.scheduledDate = { $gte: new Date() };
    }

    const bookings = await Booking.find(filter)
      .populate([
        {
          path: 'mentor',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        },
        {
          path: 'mentee',
          select: 'firstName lastName email'
        },
        {
          path: 'participants.user',
          select: 'firstName lastName email'
        }
      ])
      .sort({ scheduledDate: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Booking.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
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

// @desc    Get specific booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate([
        {
          path: 'mentor',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        },
        {
          path: 'mentee',
          select: 'firstName lastName email'
        },
        {
          path: 'participants.user',
          select: 'firstName lastName email'
        },
        {
          path: 'availability'
        }
      ]);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
      });
    }

    // Check authorization
    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    const isUserAuthorized = 
      booking.mentee._id.toString() === req.user.id.toString() ||
      (mentorProfile && booking.mentor._id.toString() === mentorProfile._id.toString());

    if (!isUserAuthorized) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
      });
    }

    // Check authorization
    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    const isUserAuthorized = 
      booking.mentee.toString() === req.user.id.toString() ||
      (mentorProfile && booking.mentor.toString() === mentorProfile._id.toString());

    if (!isUserAuthorized) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel completed booking',
      });
    }

    // Cancel the 1:1 booking
    booking.status = 'cancelled';
    booking.cancelledBy = req.user.id;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();

    await booking.save();

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (mentor only)
// @route   PUT /api/bookings/:id/status
// @access  Private (Mentor only)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, meetingLink, meetingPlatform } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
      });
    }

    // Verify user is the mentor for this booking
    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile || booking.mentor.toString() !== mentorProfile._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this booking',
      });
    }

    // Validate status
    const validStatuses = ['confirmed', 'completed', 'cancelled', 'no-show'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status',
      });
    }

    // Update booking
    if (status) booking.status = status;
    if (meetingLink) booking.meetingLink = meetingLink;
    if (meetingPlatform) booking.meetingPlatform = meetingPlatform;

    await booking.save();

    await booking.populate([
      {
        path: 'mentor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      },
      {
        path: 'mentee',
        select: 'firstName lastName email'
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentor's upcoming sessions
// @route   GET /api/bookings/mentor/upcoming
// @access  Private (Mentor only)
const getMentorUpcomingSessions = async (req, res, next) => {
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

    const now = new Date();
    const bookings = await Booking.find({
      mentor: mentorProfile._id,
      scheduledDate: { $gte: now },
      status: { $nin: ['cancelled', 'no-show'] }
    })
    .populate([
      {
        path: 'mentee',
        select: 'firstName lastName email'
      },
      {
        path: 'participants.user',
        select: 'firstName lastName email'
      }
    ])
    .sort({ scheduledDate: 1, startTime: 1 })
    .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
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
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus,
  getMentorUpcomingSessions,
};
