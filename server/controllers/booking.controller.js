const MentorProfile = require('../models/MentorProfile');
const Booking = require('../models/Booking');
const { createCalendarEvent } = require('../utils/calendar.util');
const User = require('../models/User');
const { DateTime } = require('luxon');
const mongoose = require('mongoose');

exports.createBooking = async (req, res) => {
  try {
    const { mentorId, startTime, duration, timezone, currency } = req.body;
    const menteeId = req.user.id;

    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) return res.status(404).json({ message: 'Mentor not found' });

    const startUTC = DateTime
      .fromISO(startTime, { zone: timezone })
      .toUTC();

    const endUTC = startUTC.plus({ minutes: duration });

    const overlap = await Booking.findOne({
      mentor: mentorId,
      startTimeUTC: { $lt: endUTC.toJSDate() },
      endTimeUTC: { $gt: startUTC.toJSDate() },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (overlap) {
      return res.status(409).json({ message: 'Slot already booked' });
    }

    const priceInfo = mentorProfile.sessionDurations.find(
      s => parseInt(s.duration) === parseInt(duration)
    );

    if (!priceInfo) {
      return res.status(400).json({ 
        message: `Session duration of ${duration} minutes is not available for this mentor`
      });
    }

    const priceAmount = priceInfo[`price${currency}`];
    if (priceAmount === undefined) {
      return res.status(400).json({ 
        message: `Pricing for ${currency} currency is not available`
      });
    }

    const booking = await Booking.create({
      mentor: mentorId,
      mentee: menteeId,
      mentorProfile: mentorProfile._id,
      startTimeUTC: startUTC.toJSDate(),
      endTimeUTC: endUTC.toJSDate(),
      durationMinutes: duration,
      mentorTimezone: mentorProfile.timezone, // Automatically capture mentor's timezone
      menteeTimezone: timezone, // Use timezone from request as mentee's timezone
      price: {
        amount: priceAmount,
        currency
      }
    });

    // ⬇ Google Calendar integration happens here
    // const meeting = await createCalendarEvent(...)
    // booking.meeting = meeting
    // booking.status = 'confirmed'
    // await booking.save()

    const mentorUser = await User.findById(mentorId);
    const menteeUser = await User.findById(menteeId);

    const meeting = await createCalendarEvent({
      mentorId,
      mentorEmail: mentorUser.email,
      menteeEmail: menteeUser.email,
      // mentorTimezone: mentorProfile.timezone,
      startUTC: startUTC.toJSDate(),
      endUTC: endUTC.toJSDate()
    });

    booking.meeting = {
      provider: 'google',
      meetingLink: meeting.meetingLink,
      calendarEventId: meeting.calendarEventId
    };

    booking.status = 'confirmed';
    await booking.save();


    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      message: 'Internal server error while creating booking'
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
      baseQuery.status = status;
    }

    // Add upcoming filter (only future bookings)
    if (upcoming === 'true') {
      baseQuery.startTimeUTC = { $gte: new Date() };
    }

    const bookings = await Booking.find(baseQuery)
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email')  
      .populate('mentorProfile', 'timezone sessionDurations')
      .sort({ startTimeUTC: 1 })
      .limit(parseInt(limit));

    // Add user role for each booking
    const bookingsWithRole = bookings.map(booking => ({
      ...booking.toObject(),
      userRole: booking.mentor._id.toString() === userId ? 'mentor' : 'mentee'
    }));

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
exports.getBookingAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts by status
    const statusStats = await Booking.aggregate([
      {
        $match: {
          $or: [
            { mentor: new mongoose.Types.ObjectId(userId) },
            { mentee: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get upcoming bookings count
    const upcomingCount = await Booking.countDocuments({
      $or: [
        { mentor: userId },
        { mentee: userId }
      ],
      startTimeUTC: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Get total spent/earned (as mentor and mentee)
    const mentorEarnings = await Booking.aggregate([
      {
        $match: {
          mentor: new mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$price.currency',
          total: { $sum: '$price.amount' }
        }
      }
    ]);

    const menteeSpent = await Booking.aggregate([
      {
        $match: {
          mentee: new mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$price.currency',
          total: { $sum: '$price.amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        statusBreakdown: statusStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        upcomingBookings: upcomingCount,
        mentorEarnings,
        menteeSpending: menteeSpent
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      message: 'Internal server error while fetching analytics'
    });
  }
};
