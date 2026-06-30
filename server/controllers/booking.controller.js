const MentorProfile = require('../models/MentorProfile');
const MenteeProfile = require('../models/MenteeProfile');
const Booking = require('../models/Booking');
const { createCalendarEvent, createMegaSessionCalendarEvent } = require('../utils/calendar.util');
const User = require('../models/User');
const mongoose = require('mongoose');
const bookingService = require('../services/bookingService');

exports.createBooking = async (req, res) => {
  try {
    const { mentorId, startTime, duration, timezone, currency, description } = req.body;

    if (!mentorId || !startTime || !duration || !timezone || !currency) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    const result = await bookingService.createBookingRecord({
      mentorId,
      menteeId: req.user.id,
      startTime,
      duration,
      timezone,
      currency,
      description,
    });

    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }

    res.status(result.statusCode).json({
      success: true,
      booking: result.booking,
      paymentRequired: result.paymentRequired,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      message: 'Internal server error while creating booking',
    });
  }
};

/* ======================================================
   CREATE MEGA SESSION (Admin Only)
====================================================== */
exports.createMegaSession = async (req, res) => {
  try {
    const {
      mentorId,
      startTime,
      duration,
      timezone,
      currency,
      title,
      description,
      maxParticipants = 10,
    } = req.body;

    if (!mentorId || !startTime || !duration || !timezone || !currency) {
      return res.status(400).json({ message: 'Missing required mega session fields' });
    }

    const result = await bookingService.createMegaSessionRecord({
      mentorId,
      adminId: req.user.id,
      startTime,
      duration,
      timezone,
      currency,
      title,
      description,
      maxParticipants,
    });

    if (!result.ok) {
      return res.status(result.statusCode).json({
        message: result.message,
        ...(result.overlap && { conflictingBooking: result.overlap }),
      });
    }

    res.status(result.statusCode).json({
      success: true,
      megaSession: result.megaSession,
      message: 'Mega session submitted for mentor approval',
    });
  } catch (error) {
    console.error('Error creating mega session:', error);
    res.status(500).json({
      message: 'Internal server error while creating mega session',
    });
  }
};

/* ======================================================
   GET PENDING MEGA SESSIONS (Mentor)
====================================================== */
exports.getPendingMegaSessions = async (req, res) => {
  try {
    const pendingSessions = await Booking.find({
      isMegaSession: true,
      mentor: req.user.id,
      status: 'pending',
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ startTimeUTC: 1 });

    res.status(200).json({
      success: true,
      pendingSessions,
      total: pendingSessions.length,
    });
  } catch (error) {
    console.error('Error fetching pending mega sessions:', error);
    res.status(500).json({
      message: 'Internal server error while fetching pending mega sessions',
    });
  }
};

/* ======================================================
   ACCEPT MEGA SESSION (Mentor)
====================================================== */
exports.acceptMegaSession = async (req, res) => {
  try {
    const { megaSessionId } = req.params;
    const mentorId = req.user.id;

    const megaSession = await Booking.findOne({
      _id: megaSessionId,
      isMegaSession: true,
      mentor: mentorId,
      status: 'pending',
    });

    if (!megaSession) {
      return res.status(404).json({ message: 'Pending mega session not found' });
    }

    if (!megaSession.meeting?.calendarEventId) {
      const mentorUser = await User.findById(mentorId);
      if (!mentorUser) {
        return res.status(404).json({ message: 'Mentor account not found' });
      }

      try {
        const meeting = await createMegaSessionCalendarEvent({
          mentorId,
          mentorEmail: mentorUser.email,
          startUTC: megaSession.startTimeUTC,
          endUTC: megaSession.endTimeUTC,
          title: megaSession.title,
          description: megaSession.description,
        });

        megaSession.meeting = {
          provider: 'google',
          meetingLink: meeting.meetingLink,
          calendarEventId: meeting.calendarEventId,
        };
      } catch (calendarError) {
        console.error('Error creating mega session calendar event:', calendarError);
        return res.status(502).json({
          message: 'Failed to create Google Calendar event. Please reconnect Google Calendar and try again.',
        });
      }
    }

    megaSession.status = 'confirmed';
    await megaSession.save();

    res.status(200).json({
      success: true,
      megaSession,
      message: 'Mega session confirmed and is now visible to users',
    });
  } catch (error) {
    console.error('Error accepting mega session:', error);
    res.status(500).json({
      message: 'Internal server error while accepting mega session',
    });
  }
};

/* ======================================================
   REJECT MEGA SESSION (Mentor)
====================================================== */
exports.rejectMegaSession = async (req, res) => {
  try {
    const { megaSessionId } = req.params;
    const mentorId = req.user.id;

    const megaSession = await Booking.findOne({
      _id: megaSessionId,
      isMegaSession: true,
      mentor: mentorId,
      status: 'pending',
    });

    if (!megaSession) {
      return res.status(404).json({ message: 'Pending mega session not found' });
    }

    if (megaSession.participants?.length > 0) {
      return res.status(400).json({
        message: 'Cannot reject a mega session that already has participants',
      });
    }

    const childRegistrations = await Booking.countDocuments({
      parentMegaSession: megaSessionId,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (childRegistrations > 0) {
      return res.status(400).json({
        message: 'Cannot reject a mega session that has active registrations',
      });
    }

    await Booking.deleteOne({ _id: megaSessionId });

    res.status(200).json({
      success: true,
      message: 'Mega session rejected and removed',
    });
  } catch (error) {
    console.error('Error rejecting mega session:', error);
    res.status(500).json({
      message: 'Internal server error while rejecting mega session',
    });
  }
};

/* ======================================================
   GET ALL MEGA SESSIONS (Mentees + Public View)
====================================================== */
exports.getMegaSessions = async (req, res) => {
  try {
    const { upcoming = true, limit = 50 } = req.query;

    const baseQuery = {
      isMegaSession: true,
      status: 'confirmed'
    };

    if (upcoming === 'true') {
      baseQuery.startTimeUTC = { $gte: new Date() };
    }

    const megaSessions = await Booking.find(baseQuery)
      .populate('mentor', 'firstName lastName email')
      .populate('mentorProfile', 'fullName title timezone sessionDurations headshot')
      .populate('participants', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ startTimeUTC: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      megaSessions,
      total: megaSessions.length
    });

  } catch (error) {
    console.error('Error fetching mega sessions:', error);
    res.status(500).json({
      message: 'Internal server error while fetching mega sessions'
    });
  }
};

/* ======================================================
   JOIN MEGA SESSION (Mentees)
====================================================== */
exports.joinMegaSession = async (req, res) => {
  try {
    const { megaSessionId } = req.params;
    const menteeId = req.user.id;

    const megaSession = await Booking.findOne({
      _id: megaSessionId,
      isMegaSession: true,
      status: 'confirmed'
    }).populate('mentor', 'email')
      .populate('participants', 'email');

    if (!megaSession) {
      return res.status(404).json({ message: 'Mega session not found' });
    }

    // Check if session is in the future
    if (new Date() >= megaSession.startTimeUTC) {
      return res.status(400).json({ message: 'Cannot join past sessions' });
    }

    const existingParticipantBooking = await Booking.findOne({
      parentMegaSession: megaSessionId,
      mentee: menteeId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingParticipantBooking) {
      return res.status(200).json({
        success: true,
        participantBooking: existingParticipantBooking,
        megaSession: {
          ...megaSession.toObject(),
          participantCount: megaSession.participants.length
        },
        paymentRequired: existingParticipantBooking.status !== 'confirmed'
      });
    }

    const activeRegistrations = await Booking.countDocuments({
      parentMegaSession: megaSessionId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeRegistrations >= megaSession.maxParticipants) {
      return res.status(400).json({ message: 'Session is full' });
    }

    const participantBooking = await Booking.create({
      mentor: megaSession.mentor._id,
      mentee: menteeId,
      mentorProfile: megaSession.mentorProfile,
      startTimeUTC: megaSession.startTimeUTC,
      endTimeUTC: megaSession.endTimeUTC,
      durationMinutes: megaSession.durationMinutes,
      mentorTimezone: megaSession.mentorTimezone,
      menteeTimezone: req.body.timezone || megaSession.menteeTimezone,
      isMegaSession: false,
      price: megaSession.price,
      payment: {
        provider: 'paypal',
        amount: megaSession.price.amount,
        currency: megaSession.price.currency,
        status: 'pending'
      },
      status: 'pending',
      parentMegaSession: megaSessionId
    });

    res.status(200).json({
      success: true,
      participantBooking,
      megaSession: {
        ...megaSession.toObject(),
        participantCount: megaSession.participants.length
      },
      paymentRequired: true
    });

  } catch (error) {
    console.error('Error joining mega session:', error);
    res.status(500).json({
      message: 'Internal server error while joining mega session'
    });
  }
};

/* ======================================================
   GET MY BOOKINGS (Unified for Mentor & Mentee)
====================================================== */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, upcoming, limit = 50 } = req.query;

    // Build query filters
    const baseQuery = {
      $or: [
        { mentor: userId },
        { mentee: userId }
      ]
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      const statusValues = status.split(',').map(value => value.trim()).filter(Boolean);
      baseQuery.status = statusValues.length > 1 ? { $in: statusValues } : statusValues[0];
    }

    // Add upcoming filter (only future bookings)
    if (upcoming === 'true') {
      baseQuery.startTimeUTC = { $gte: new Date() };
    }

    const bookings = await Booking.find(baseQuery)
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email')
      .populate('mentorProfile', 'timezone sessionDurations headshot')
      .sort({ startTimeUTC: 1 })
      .limit(parseInt(limit));

    const menteeIds = [
      ...new Set(
        bookings
          .filter((booking) => booking.mentee)
          .map((booking) => booking.mentee._id.toString())
      ),
    ];

    const menteeProfiles = menteeIds.length
      ? await MenteeProfile.find({ user: { $in: menteeIds } }).select('user headshot')
      : [];

    const menteeHeadshotByUserId = menteeProfiles.reduce((acc, profile) => {
      acc[profile.user.toString()] = profile.headshot || null;
      return acc;
    }, {});

    const MEGA_SESSION_IMAGE = '/mega-session.jpg';

    // Add user role and headshots for each booking
    const bookingsWithRole = bookings.map((booking) => {
      const bookingObj = booking.toObject();
      const menteeHeadshot = booking.mentee
        ? menteeHeadshotByUserId[booking.mentee._id.toString()] || null
        : null;

      return {
        ...bookingObj,
        userRole: booking.mentor._id.toString() === userId ? 'mentor' : 'mentee',
        mentorHeadshot: bookingObj.mentorProfile?.headshot || null,
        menteeHeadshot,
        megaSessionImage: bookingObj.isMegaSession || bookingObj.parentMegaSession
          ? MEGA_SESSION_IMAGE
          : null,
      };
    });

    res.status(200).json({
      success: true,
      bookings: bookingsWithRole,
      total: bookingsWithRole.length
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      message: 'Internal server error while fetching bookings'
    });
  }
};

/* ======================================================
   GET BOOKING ANALYTICS (Basic Stats)
====================================================== */
const formatDashboardBooking = (booking, userId) => {
  const isMentor = booking.mentor?._id?.toString() === userId;
  const otherUser = isMentor ? booking.mentee : booking.mentor;
  const otherName = booking.isMegaSession
    ? booking.title || 'Mega Session'
    : otherUser
      ? `${otherUser.firstName} ${otherUser.lastName}`
      : 'Participant';

  return {
    id: booking._id,
    status: booking.status,
    isMegaSession: booking.isMegaSession,
    title: booking.title || booking.description || null,
    otherName,
    durationMinutes: booking.durationMinutes,
    startTimeUTC: booking.startTimeUTC,
    timezone: isMentor ? booking.mentorTimezone : booking.menteeTimezone,
    price: booking.price,
    updatedAt: booking.updatedAt,
    createdAt: booking.createdAt,
  };
};

const buildRecentActivity = (bookings, userId) =>
  bookings.map((booking) => {
    const isMentor = booking.mentor?._id?.toString() === userId;
    const otherUser = isMentor ? booking.mentee : booking.mentor;
    const otherName = booking.isMegaSession
      ? booking.title || 'Mega Session'
      : otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : 'Participant';

    const activityMap = {
      completed: `Session completed with ${otherName}`,
      confirmed: `Session confirmed with ${otherName}`,
      pending: `Booking pending with ${otherName}`,
      cancelled: `Session cancelled with ${otherName}`,
      'no-show': `No-show recorded for ${otherName}`,
    };

    return {
      id: booking._id,
      title: activityMap[booking.status] || `Session updated with ${otherName}`,
      status: booking.status,
      timestamp: booking.updatedAt || booking.createdAt,
    };
  });

exports.getBookingAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const userBookingMatch = {
      $or: [
        { mentor: userObjectId },
        { mentee: userObjectId },
      ],
    };

    // Get counts by status
    const statusStats = await Booking.aggregate([
      { $match: userBookingMatch },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = statusStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const totalSessions = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
    const completedSessions = statusBreakdown.completed || 0;

    // Get upcoming bookings count
    const upcomingCount = await Booking.countDocuments({
      $or: [
        { mentor: userId },
        { mentee: userId },
      ],
      startTimeUTC: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] },
    });

    const hoursResult = await Booking.aggregate([
      { $match: { ...userBookingMatch, status: 'completed' } },
      { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
    ]);
    const totalHours = hoursResult[0]
      ? Math.round((hoursResult[0].totalMinutes / 60) * 10) / 10
      : 0;

    const uniqueMenteesResult = await Booking.aggregate([
      { $match: { mentor: userObjectId, mentee: { $ne: null } } },
      { $group: { _id: '$mentee' } },
      { $count: 'count' },
    ]);
    const uniqueMentees = uniqueMenteesResult[0]?.count || 0;

    const uniqueMentorsResult = await Booking.aggregate([
      { $match: { mentee: userObjectId, mentor: { $ne: null } } },
      { $group: { _id: '$mentor' } },
      { $count: 'count' },
    ]);
    const uniqueMentors = uniqueMentorsResult[0]?.count || 0;

    // Get total spent/earned (as mentor and mentee)
    const mentorEarnings = await Booking.aggregate([
      {
        $match: {
          mentor: userObjectId,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$price.currency',
          total: { $sum: '$price.amount' },
        },
      },
    ]);

    const menteeSpent = await Booking.aggregate([
      {
        $match: {
          mentee: userObjectId,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$price.currency',
          total: { $sum: '$price.amount' },
        },
      },
    ]);

    const upcomingBookingsList = await Booking.find({
      $or: [{ mentor: userId }, { mentee: userId }],
      startTimeUTC: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('mentor', 'firstName lastName')
      .populate('mentee', 'firstName lastName')
      .sort({ startTimeUTC: 1 })
      .limit(5);

    const recentBookingsList = await Booking.find(userBookingMatch)
      .populate('mentor', 'firstName lastName')
      .populate('mentee', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(5);

    let platformStats = null;
    if (userRole === 'admin') {
      const [
        totalBookings,
        totalMegaSessions,
        upcomingMegaSessions,
        totalMentors,
        totalUsers,
        pendingBookings,
        confirmedBookings,
      ] = await Promise.all([
        Booking.countDocuments({}),
        Booking.countDocuments({ isMegaSession: true }),
        Booking.countDocuments({
          isMegaSession: true,
          startTimeUTC: { $gte: new Date() },
          status: 'confirmed',
        }),
        MentorProfile.countDocuments({}),
        User.countDocuments({}),
        Booking.countDocuments({ status: 'pending' }),
        Booking.countDocuments({ status: 'confirmed' }),
      ]);

      platformStats = {
        totalBookings,
        totalMegaSessions,
        upcomingMegaSessions,
        totalMentors,
        totalUsers,
        pendingBookings,
        confirmedBookings,
      };
    }

    res.status(200).json({
      success: true,
      analytics: {
        statusBreakdown,
        upcomingBookings: upcomingCount,
        mentorEarnings,
        menteeSpending: menteeSpent,
        totalSessions,
        completedSessions,
        totalHours,
        uniqueMentees,
        uniqueMentors,
        upcomingSessions: upcomingBookingsList.map((booking) => formatDashboardBooking(booking, userId)),
        recentActivity: buildRecentActivity(recentBookingsList, userId),
        platformStats,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      message: 'Internal server error while fetching analytics',
    });
  }
};

exports.getDurationOptions = (req, res) => {
  res.json({
    success: true,
    durations: bookingService.getDurationOptions(),
  });
};
