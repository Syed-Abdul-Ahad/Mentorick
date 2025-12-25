const MentorProfile = require('../models/MentorProfile');
const Booking = require('../models/Booking');
const { createCalendarEvent, createMegaSessionCalendarEvent, updateMegaSessionAttendees } = require('../utils/calendar.util');
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
      maxParticipants = 10 
    } = req.body;
    
    // Parse duration to extract number (handle "30 min" or just "30")
    const durationMinutes = typeof duration === 'string' 
      ? parseInt(duration.toString().replace(/\D/g, '')) 
      : parseInt(duration);
      
    if (!durationMinutes || ![15, 30, 60].includes(durationMinutes)) {
      return res.status(400).json({ 
        message: 'Invalid duration. Must be 15, 30, or 60 minutes' 
      });
    }
    
    const adminId = req.user.id;

    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) return res.status(404).json({ message: 'Mentor not found' });

    const startUTC = DateTime
      .fromISO(startTime, { zone: timezone })
      .toUTC();

    const endUTC = startUTC.plus({ minutes: durationMinutes });

    // Check for conflicts with existing bookings
    const overlap = await Booking.findOne({
      mentor: mentorId,
      startTimeUTC: { $lt: endUTC.toJSDate() },
      endTimeUTC: { $gt: startUTC.toJSDate() },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (overlap) {
      return res.status(409).json({ 
        message: 'Time slot conflicts with existing booking',
        conflictingBooking: overlap
      });
    }

    const priceInfo = mentorProfile.sessionDurations.find(
      s => parseInt(s.duration) === parseInt(durationMinutes)
    );

    if (!priceInfo) {
      return res.status(400).json({ 
        message: `Session duration of ${durationMinutes} minutes is not available for this mentor`
      });
    }

    const priceAmount = priceInfo[`price${currency}`];
    if (priceAmount === undefined) {
      return res.status(400).json({ 
        message: `Pricing for ${currency} currency is not available`
      });
    }

    // Create mega session booking
    const megaSession = await Booking.create({
      mentor: mentorId,
      mentorProfile: mentorProfile._id,
      startTimeUTC: startUTC.toJSDate(),
      endTimeUTC: endUTC.toJSDate(),
      durationMinutes: durationMinutes,
      mentorTimezone: mentorProfile.timezone,
      menteeTimezone: timezone,
      isMegaSession: true,
      title: title || 'Mega Mentorship Session',
      description: description || 'Group mentorship session with multiple participants',
      maxParticipants,
      participants: [],
      createdBy: adminId,
      price: {
        amount: priceAmount,
        currency
      }
    });

    // Create calendar event for mentor
    const mentorUser = await User.findById(mentorId);

    const meeting = await createMegaSessionCalendarEvent({
      mentorId,
      mentorEmail: mentorUser.email,
      startUTC: startUTC.toJSDate(),
      endUTC: endUTC.toJSDate(),
      title: megaSession.title,
      description: megaSession.description
    });

    megaSession.meeting = {
      provider: 'google',
      meetingLink: meeting.meetingLink,
      calendarEventId: meeting.calendarEventId
    };

    megaSession.status = 'confirmed';
    await megaSession.save();

    res.status(201).json({
      success: true,
      megaSession
    });
  } catch (error) {
    console.error('Error creating mega session:', error);
    res.status(500).json({
      message: 'Internal server error while creating mega session'
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
      .populate('mentorProfile', 'fullName title timezone sessionDurations')
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

    // Check if already joined
    if (megaSession.participants.some(p => p._id.toString() === menteeId)) {
      return res.status(400).json({ message: 'Already joined this session' });
    }

    // Check if session is full
    if (megaSession.participants.length >= megaSession.maxParticipants) {
      return res.status(400).json({ message: 'Session is full' });
    }

    // Add mentee to participants
    megaSession.participants.push(menteeId);
    await megaSession.save();

    // Update calendar event with new attendee
    const menteeUser = await User.findById(menteeId);
    
    // Get all participant emails (need to populate the updated participants array)
    const participantUsers = await User.find({ 
      _id: { $in: megaSession.participants } 
    }).select('email');
    
    const allAttendeeEmails = [
      megaSession.mentor.email,
      ...participantUsers.map(p => p.email).filter(email => email), // Filter out any null/undefined emails
      menteeUser.email
    ].filter(email => email); // Remove any undefined emails

    await updateMegaSessionAttendees({
      mentorId: megaSession.mentor._id,
      calendarEventId: megaSession.meeting.calendarEventId,
      attendeeEmails: allAttendeeEmails,
      title: megaSession.title,
      description: megaSession.description
    });

    // Create individual booking record for tracking
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
      status: 'confirmed',
      meeting: megaSession.meeting,
      parentMegaSession: megaSessionId
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined mega session',
      participantBooking,
      megaSession: {
        ...megaSession.toObject(),
        participantCount: megaSession.participants.length
      }
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
