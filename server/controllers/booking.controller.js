const MentorProfile = require('../models/MentorProfile');
const MenteeProfile = require('../models/MenteeProfile');
const Booking = require('../models/Booking');
const { createCalendarEvent, createMegaSessionCalendarEvent } = require('../utils/calendar.util');
const User = require('../models/User');
const mongoose = require('mongoose');
const bookingService = require('../services/bookingService');
const { getPlatformFeeRate, computeFeeSplit } = require('../utils/paymentConfig');

exports.createBooking = async (req, res) => {
  try {
    const { mentorId, startTime, duration, timezone, currency, description } = req.body;

    if (!mentorId || !startTime || !duration || !timezone || !currency) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    if (typeof description === 'string' && description.length > 1500) {
      return res.status(400).json({
        message: 'Session description cannot exceed 1500 characters',
      });
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
      bankDetails: result.bankDetails,
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
      priceAmount,
      title,
      description,
      maxParticipants = 10,
    } = req.body;

    if (!mentorId || !startTime || !duration || !timezone || !currency) {
      return res.status(400).json({ message: 'Missing required mega session fields' });
    }

    if (priceAmount === undefined || priceAmount === null || priceAmount === '') {
      return res.status(400).json({ message: 'Price per mentee (priceAmount) is required' });
    }

    const result = await bookingService.createMegaSessionRecord({
      mentorId,
      adminId: req.user.id,
      startTime,
      duration,
      timezone,
      currency,
      priceAmount,
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
    const { completePastConfirmedBookings } = require('../services/bookingCompletionService');
    await completePastConfirmedBookings();

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
    const { expireUnpaidProofBookings } = require('../services/paymentExpiryService');
    const { buildInitialBankPayment, getBankDetails, getBookingMinLeadHours } = require('../utils/paymentConfig');
    const { DateTime } = require('luxon');

    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot join mega sessions' });
    }

    await expireUnpaidProofBookings();

    const megaSession = await Booking.findOne({
      _id: megaSessionId,
      isMegaSession: true,
      status: 'confirmed'
    }).populate('mentor', 'email')
      .populate('participants', 'email');

    if (!megaSession) {
      return res.status(404).json({ message: 'Mega session not found' });
    }

    if (new Date() >= megaSession.startTimeUTC) {
      return res.status(400).json({ message: 'Cannot join past sessions' });
    }

    const minLeadHours = getBookingMinLeadHours();
    const earliestAllowed = DateTime.now().toUTC().plus({ hours: minLeadHours });
    if (DateTime.fromJSDate(megaSession.startTimeUTC).toUTC() < earliestAllowed) {
      return res.status(400).json({
        message: `Sessions must be booked at least ${minLeadHours} hours in advance`,
      });
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
        paymentRequired: existingParticipantBooking.status !== 'confirmed',
        bankDetails: getBankDetails(),
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
      payment: buildInitialBankPayment({
        amount: megaSession.price.amount,
        currency: megaSession.price.currency,
      }),
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
      paymentRequired: true,
      bankDetails: getBankDetails(),
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
    const { completePastConfirmedBookings } = require('../services/bookingCompletionService');
    await completePastConfirmedBookings();

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

    const { sanitizeMeetingForViewer } = require('./paymentController');

    // Add user role and headshots for each booking
    const bookingsWithRole = bookings.map((booking) => {
      const bookingObj = booking.toObject();
      const userRole = booking.mentor._id.toString() === userId ? 'mentor' : 'mentee';
      const menteeHeadshot = booking.mentee
        ? menteeHeadshotByUserId[booking.mentee._id.toString()] || null
        : null;

      const sanitized = sanitizeMeetingForViewer(bookingObj, req.user.role === 'admin' ? 'admin' : userRole);

      return {
        ...sanitized,
        userRole,
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

  const meetingVisible = booking.status === 'confirmed' && booking.payment?.status === 'paid';

  return {
    id: booking._id,
    status: booking.status,
    paymentStatus: booking.payment?.status || null,
    isMegaSession: booking.isMegaSession,
    title: booking.title || booking.description || null,
    otherName,
    durationMinutes: booking.durationMinutes,
    startTimeUTC: booking.startTimeUTC,
    timezone: isMentor ? booking.mentorTimezone : booking.menteeTimezone,
    price: booking.price,
    platformFee: booking.payment?.platformFee ?? null,
    mentorPayoutAmount: booking.payment?.mentorPayoutAmount ?? null,
    meetingLink: meetingVisible ? booking.meeting?.meetingLink : null,
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
    const { completePastConfirmedBookings } = require('../services/bookingCompletionService');
    await completePastConfirmedBookings();

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

    // Mentor earnings = mentor share on confirmed/completed paid sessions
    const feeRate = getPlatformFeeRate();
    const mentorRate = 1 - feeRate;
    const mentorEarnings = await Booking.aggregate([
      {
        $match: {
          mentor: userObjectId,
          status: { $in: ['confirmed', 'completed'] },
          'payment.status': 'paid',
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$payment.currency', '$price.currency'] },
          total: {
            $sum: {
              $ifNull: ['$payment.mentorPayoutAmount', { $multiply: ['$price.amount', mentorRate] }],
            },
          },
          gross: { $sum: { $ifNull: ['$payment.amount', '$price.amount'] } },
          platformFees: {
            $sum: {
              $ifNull: ['$payment.platformFee', { $multiply: ['$price.amount', feeRate] }],
            },
          },
        },
      },
    ]);

    const menteeSpent = await Booking.aggregate([
      {
        $match: {
          mentee: userObjectId,
          status: { $in: ['confirmed', 'completed'] },
          'payment.status': 'paid',
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$payment.currency', '$price.currency'] },
          total: { $sum: { $ifNull: ['$payment.amount', '$price.amount'] } },
        },
      },
    ]);

    let awaitingVerification = [];
    if (userRole === 'admin') {
      awaitingVerification = await Booking.find({
        status: 'pending',
        'payment.status': 'awaiting_verification',
      })
        .populate('mentor', 'firstName lastName')
        .populate('mentee', 'firstName lastName')
        .sort({ 'payment.proofUploadedAt': 1 })
        .limit(20);
    }

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

      const revenueAgg = await Booking.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'completed'] },
            'payment.status': 'paid',
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$payment.currency', '$price.currency'] },
            gross: { $sum: { $ifNull: ['$payment.amount', '$price.amount'] } },
            platformFees: {
              $sum: {
                $ifNull: ['$payment.platformFee', { $multiply: ['$price.amount', feeRate] }],
              },
            },
            mentorPayouts: {
              $sum: {
                $ifNull: ['$payment.mentorPayoutAmount', { $multiply: ['$price.amount', mentorRate] }],
              },
            },
          },
        },
      ]);

      platformStats = {
        totalBookings,
        totalMegaSessions,
        upcomingMegaSessions,
        totalMentors,
        totalUsers,
        pendingBookings,
        confirmedBookings,
        awaitingVerificationCount: awaitingVerification.length,
        revenue: revenueAgg,
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
        awaitingVerification: awaitingVerification.map((b) => ({
          id: b._id,
          status: b.status,
          paymentStatus: b.payment?.status,
          amount: b.payment?.amount ?? b.price?.amount,
          currency: b.payment?.currency || b.price?.currency,
          platformFee: b.payment?.platformFee,
          mentorPayoutAmount: b.payment?.mentorPayoutAmount,
          proofImageUrl: b.payment?.proofImageUrl,
          proofUploadedAt: b.payment?.proofUploadedAt,
          startTimeUTC: b.startTimeUTC,
          mentorName: b.mentor ? `${b.mentor.firstName} ${b.mentor.lastName}` : null,
          menteeName: b.mentee ? `${b.mentee.firstName} ${b.mentee.lastName}` : null,
        })),
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

/* ======================================================
   GET PAYMENT HISTORY (Dashboard Payments tab)
   Role-scoped list + totals. Does not change booking/payment flows.
====================================================== */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const {
      paymentStatus = 'all',
      currency = 'all',
      from,
      to,
      limit = '50',
      page = '1',
    } = req.query;

    // Cap at 1000 — Payments tab loads a month-sized batch for client-side status filter/pagination
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 1000);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const match = {
      mentee: { $ne: null },
      isMegaSession: { $ne: true },
    };

    if (userRole === 'mentor') {
      match.mentor = userObjectId;
    } else if (userRole === 'mentee') {
      match.mentee = userObjectId;
    } else if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedPaymentStatuses = [
      'awaiting_proof',
      'awaiting_verification',
      'paid',
      'expired',
      'failed',
      'rejected',
    ];
    if (paymentStatus && paymentStatus !== 'all') {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid paymentStatus filter' });
      }
      match['payment.status'] = paymentStatus;
    }

    if (currency && currency !== 'all') {
      if (!['USD', 'PKR'].includes(currency)) {
        return res.status(400).json({ message: 'Invalid currency filter' });
      }
      match.$expr = {
        $eq: [{ $ifNull: ['$payment.currency', '$price.currency'] }, currency],
      };
    }

    if (from || to) {
      const range = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({ message: 'Invalid from date' });
        }
        range.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({ message: 'Invalid to date' });
        }
        toDate.setHours(23, 59, 59, 999);
        range.$lte = toDate;
      }
      match.createdAt = range;
    }

    const feeRate = getPlatformFeeRate();
    const mentorRate = 1 - feeRate;

    const [items, totalCount, totalsAgg, statusBreakdown] = await Promise.all([
      Booking.find(match)
        .populate('mentor', 'firstName lastName email')
        .populate('mentee', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Booking.countDocuments(match),
      // Money fields (grossBooked / fees / payouts) count paid only.
      // Rejected / awaiting / expired rows stay in the list + mix, but add $0.
      Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $ifNull: ['$payment.currency', '$price.currency'] },
            grossBooked: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  { $ifNull: ['$payment.amount', '$price.amount'] },
                  0,
                ],
              },
            },
            platformFees: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  {
                    $ifNull: ['$payment.platformFee', { $multiply: ['$price.amount', feeRate] }],
                  },
                  0,
                ],
              },
            },
            mentorPayouts: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  {
                    $ifNull: [
                      '$payment.mentorPayoutAmount',
                      { $multiply: ['$price.amount', mentorRate] },
                    ],
                  },
                  0,
                ],
              },
            },
            paidGross: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  { $ifNull: ['$payment.amount', '$price.amount'] },
                  0,
                ],
              },
            },
            paidPlatformFees: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  {
                    $ifNull: ['$payment.platformFee', { $multiply: ['$price.amount', feeRate] }],
                  },
                  0,
                ],
              },
            },
            paidMentorPayouts: {
              $sum: {
                $cond: [
                  { $eq: ['$payment.status', 'paid'] },
                  {
                    $ifNull: [
                      '$payment.mentorPayoutAmount',
                      { $multiply: ['$price.amount', mentorRate] },
                    ],
                  },
                  0,
                ],
              },
            },
            count: { $sum: 1 },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0] },
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$payment.status', 'rejected'] }, 1, 0] },
            },
            awaitingVerificationCount: {
              $sum: {
                $cond: [{ $eq: ['$payment.status', 'awaiting_verification'] }, 1, 0],
              },
            },
            awaitingProofCount: {
              $sum: {
                $cond: [{ $eq: ['$payment.status', 'awaiting_proof'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Booking.aggregate([
        { $match: match },
        { $group: { _id: '$payment.status', count: { $sum: 1 } } },
      ]),
    ]);

    const mentorIds = [...new Set(items.map((b) => b.mentor?._id?.toString()).filter(Boolean))];
    const menteeIds = [...new Set(items.map((b) => b.mentee?._id?.toString()).filter(Boolean))];

    const [mentorProfiles, menteeProfiles] = await Promise.all([
      mentorIds.length
        ? MentorProfile.find({ user: { $in: mentorIds } }).select('user headshot').lean()
        : [],
      menteeIds.length
        ? MenteeProfile.find({ user: { $in: menteeIds } }).select('user headshot').lean()
        : [],
    ]);

    const mentorHeadshotByUser = Object.fromEntries(
      mentorProfiles.map((p) => [p.user.toString(), p.headshot || null])
    );
    const menteeHeadshotByUser = Object.fromEntries(
      menteeProfiles.map((p) => [p.user.toString(), p.headshot || null])
    );

    const payments = items.map((b) => {
      const amount = b.payment?.amount ?? b.price?.amount ?? 0;
      const curr = b.payment?.currency || b.price?.currency || null;
      const split = computeFeeSplit(amount);
      const platformFee = b.payment?.platformFee ?? split.platformFee;
      const mentorPayout = b.payment?.mentorPayoutAmount ?? split.mentorPayoutAmount;
      const mentorId = b.mentor?._id?.toString();
      const menteeId = b.mentee?._id?.toString();

      return {
        id: b._id,
        bookingStatus: b.status,
        paymentStatus: b.payment?.status || null,
        amount,
        currency: curr,
        platformFee,
        mentorPayoutAmount: mentorPayout,
        proofImageUrl: b.payment?.proofImageUrl || null,
        proofUploadedAt: b.payment?.proofUploadedAt || null,
        verifiedAt: b.payment?.verifiedAt || null,
        rejectionReason: b.payment?.rejectionReason || null,
        startTimeUTC: b.startTimeUTC,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        parentMegaSession: b.parentMegaSession || null,
        mentor: b.mentor
          ? {
              id: b.mentor._id,
              name: `${b.mentor.firstName || ''} ${b.mentor.lastName || ''}`.trim(),
              email: b.mentor.email,
              headshot: mentorId ? mentorHeadshotByUser[mentorId] || null : null,
            }
          : null,
        mentee: b.mentee
          ? {
              id: b.mentee._id,
              name: `${b.mentee.firstName || ''} ${b.mentee.lastName || ''}`.trim(),
              email: b.mentee.email,
              headshot: menteeId ? menteeHeadshotByUser[menteeId] || null : null,
            }
          : null,
      };
    });

    const paymentStatusBreakdown = statusBreakdown.reduce((acc, row) => {
      acc[row._id || 'unknown'] = row.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      role: userRole,
      filters: {
        paymentStatus,
        currency,
        from: from || null,
        to: to || null,
      },
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalCount,
        totalPages: Math.max(Math.ceil(totalCount / parsedLimit), 1),
      },
      totals: totalsAgg.map((t) => ({
        currency: t._id,
        grossBooked: t.grossBooked,
        platformFees: t.platformFees,
        mentorPayouts: t.mentorPayouts,
        paidGross: t.paidGross,
        paidPlatformFees: t.paidPlatformFees,
        paidMentorPayouts: t.paidMentorPayouts,
        count: t.count,
        paidCount: t.paidCount,
        rejectedCount: t.rejectedCount,
        awaitingVerificationCount: t.awaitingVerificationCount,
        awaitingProofCount: t.awaitingProofCount,
      })),
      paymentStatusBreakdown,
      payments,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      message: 'Internal server error while fetching payment history',
    });
  }
};
