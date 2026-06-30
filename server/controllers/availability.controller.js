const MentorProfile = require('../models/MentorProfile');
const {
  hasDuplicateSlots,
  isValidHour
} = require('../validator/availability.validator');
const Booking = require('../models/Booking');
const bookingService = require('../services/bookingService');

/* ======================================================
   SET WEEKLY AVAILABILITY (Repeat ON)
====================================================== */
exports.setWeeklyAvailability = async (req, res) => {
  try {
    const { dayOfWeek, slots, isActive = true } = req.body;

    if (req.body.availability && typeof req.body.availability === 'string') {
      return res.status(400).json({
        message: 'Invalid availability format. Use dedicated availability endpoints.'
      });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'Invalid dayOfWeek' });
    }

    if (isActive === false) {
      const mentor = await MentorProfile.findOne({ user: req.user.id });

      mentor.availability.weekly = mentor.availability.weekly.filter(
        w => w.dayOfWeek !== dayOfWeek
      );

      await mentor.save();

      return res.status(200).json({
        success: true,
        message: 'Weekly availability deactivated'
      });
    }

    if (!slots || !slots.length) {
      return res.status(400).json({ message: 'Slots are required for active weekly availability' });
    }

    if (hasDuplicateSlots(slots)) {
      return res.status(400).json({ message: 'Duplicate slots detected' });
    }

    if (!slots.every(s => isValidHour(s.hour))) {
      return res.status(400).json({ message: 'Invalid hour detected' });
    }

    const mentor = await MentorProfile.findOne({ user: req.user.id });

    if (!mentor.availability || typeof mentor.availability !== 'object') {
      mentor.availability = { weekly: [], specificDates: [], unavailability: [] };
    }
    if (!Array.isArray(mentor.availability.weekly)) {
      mentor.availability.weekly = [];
    }

    mentor.availability.weekly =
      mentor.availability.weekly.filter(w => w.dayOfWeek !== dayOfWeek);

    mentor.availability.weekly.push({
      dayOfWeek,
      slots,
      isActive: true
    });

    await mentor.save();

    res.status(200).json({
      success: true,
      message: 'Weekly availability saved'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   SET DATE-SPECIFIC AVAILABILITY (Repeat OFF)
====================================================== */
exports.setDateAvailability = async (req, res) => {
  try {
    const { date, slots } = req.body;

    if (req.body.availability && typeof req.body.availability === 'string') {
      return res.status(400).json({
        message: 'Invalid availability format. Use dedicated availability endpoints.'
      });
    }

    if (!date || !slots?.length) {
      return res.status(400).json({ message: 'Date and slots required' });
    }

    if (hasDuplicateSlots(slots)) {
      return res.status(400).json({ message: 'Duplicate slots detected' });
    }

    const mentor = await MentorProfile.findOne({ user: req.user.id });

    if (!mentor.availability || typeof mentor.availability !== 'object') {
      mentor.availability = { weekly: [], specificDates: [], unavailability: [] };
    }
    if (!Array.isArray(mentor.availability.specificDates)) {
      mentor.availability.specificDates = [];
    }

    mentor.availability.specificDates =
      mentor.availability.specificDates.filter(
        d => d.date.toISOString().split('T')[0] !== date
      );

    mentor.availability.specificDates.push({ date, slots });

    await mentor.save();

    res.status(200).json({
      success: true,
      message: 'Date-specific availability saved'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   SET UNAVAILABILITY (BLACKOUT DATES)
====================================================== */
exports.setUnavailability = async (req, res) => {
  try {
    const { from, to, reason, force = false } = req.body;

    if (req.body.availability && typeof req.body.availability === 'string') {
      return res.status(400).json({
        message: 'Invalid availability format. Use dedicated availability endpoints.'
      });
    }

    if (!from || !to) {
      return res.status(400).json({ message: 'From and To dates required' });
    }

    if (new Date(from) > new Date(to)) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const mentor = await MentorProfile.findOne({ user: req.user.id });

    if (!mentor.availability || typeof mentor.availability !== 'object') {
      mentor.availability = { weekly: [], specificDates: [], unavailability: [] };
    }
    if (!Array.isArray(mentor.availability.unavailability)) {
      mentor.availability.unavailability = [];
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      mentor: req.user.id,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startTimeUTC: { $gte: fromDate, $lte: toDate } },
        { endTimeUTC: { $gte: fromDate, $lte: toDate } },
        { startTimeUTC: { $lt: fromDate }, endTimeUTC: { $gt: toDate } }
      ]
    }).populate('mentee', 'firstName lastName email');

    if (existingBookings.length > 0 && !force) {
      const conflictDetails = existingBookings.map(booking => ({
        id: booking._id,
        mentee: `${booking.mentee.firstName} ${booking.mentee.lastName}`,
        startTime: booking.startTimeUTC,
        endTime: booking.endTimeUTC,
        status: booking.status,
        duration: booking.durationMinutes
      }));

      return res.status(409).json({
        message: 'Cannot set unavailability: You have existing bookings in this time period',
        conflictingBookings: conflictDetails,
        suggestion: 'Please cancel or reschedule these bookings first, or set force=true to override (not recommended)'
      });
    }

    if (force && existingBookings.length > 0) {
      console.warn(`Mentor ${req.user.id} forced unavailability despite ${existingBookings.length} existing bookings`);
    }

    mentor.availability.unavailability.push({ from, to, reason });

    await mentor.save();

    res.status(200).json({
      success: true,
      message: force && existingBookings.length > 0
        ? 'Unavailability added (with existing bookings - please handle conflicts)'
        : 'Unavailability added successfully',
      ...(force && existingBookings.length > 0 && {
        warning: 'You have existing bookings in this period that need to be handled manually'
      })
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET AVAILABILITY FOR MENTEE (Timezone Safe)
====================================================== */
exports.getMentorAvailabilityForMentee = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const menteeTimezone = req.query.timezone;

    if (!menteeTimezone) {
      return res.status(400).json({ message: 'timezone query parameter is required' });
    }

    const { mentorProfile, availability } = await bookingService.getMenteeAvailability(
      mentorId,
      menteeTimezone
    );

    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    res.json({ success: true, availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET MY AVAILABILITY (Mentor Only - Raw Data)
====================================================== */
exports.getMyAvailability = async (req, res) => {
  try {
    const mentor = await MentorProfile.findOne({ user: req.user.id });

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        timezone: mentor.timezone,
        weekly: mentor.availability.weekly || [],
        specificDates: mentor.availability.specificDates || [],
        unavailability: mentor.availability.unavailability || []
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
