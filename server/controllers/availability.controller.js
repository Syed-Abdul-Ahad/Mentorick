const MentorProfile = require('../models/MentorProfile');
const {
  localHourToUTC,
  utcToLocalHour,
  isDateBlocked
} = require('../utils/time.util');
const Booking = require('../models/Booking');
const { subtractBookings } = require('../utils/slot.util');
const { DateTime } = require('luxon');

const {
  hasDuplicateSlots,
  isValidHour
} = require('../validator/availability.validator');

/* ======================================================
   SET WEEKLY AVAILABILITY (Repeat ON)
====================================================== */
exports.setWeeklyAvailability = async (req, res) => {
  try {
    const { dayOfWeek, slots, isActive = true } = req.body;

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'Invalid dayOfWeek' });
    }

    // If isActive is false, we're deactivating weekly availability
    if (isActive === false) {
      const mentor = await MentorProfile.findOne({ user: req.user.id });
      
      // Remove or deactivate weekly availability for this day
      mentor.availability.weekly = mentor.availability.weekly.filter(
        w => w.dayOfWeek !== dayOfWeek
      );

      await mentor.save();

      return res.status(200).json({
        success: true,
        message: 'Weekly availability deactivated'
      });
    }

    // For active weekly availability, require slots
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

    if (!date || !slots?.length) {
      return res.status(400).json({ message: 'Date and slots required' });
    }

    if (hasDuplicateSlots(slots)) {
      return res.status(400).json({ message: 'Duplicate slots detected' });
    }

    const mentor = await MentorProfile.findOne({ user: req.user.id });

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
    const { from, to, reason } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: 'From and To dates required' });
    }

    if (new Date(from) > new Date(to)) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const mentor = await MentorProfile.findOne({ user: req.user.id });

    mentor.availability.unavailability.push({ from, to, reason });

    await mentor.save();

    res.status(200).json({
      success: true,
      message: 'Unavailability added'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET AVAILABILITY FOR MENTEE (Timezone Safe)
====================================================== */

exports.getMentorAvailabilityForMentee = async (req, res) => {
  const { mentorId } = req.params;
  const menteeTimezone = req.query.timezone;

  const mentor = await MentorProfile.findOne({ user: mentorId });
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

  const availabilityByDate = new Map(); // Group slots by mentee's local date

  for (let i = 0; i < 14; i++) {
    const date = DateTime.now().plus({ days: i });

    if (isDateBlocked(date.toJSDate(), mentor.availability.unavailability)) {
      continue;
    }

    const daySlots =
      mentor.availability.specificDates.find(d =>
        DateTime.fromJSDate(d.date).hasSame(date, 'day')
      )?.slots ||
      mentor.availability.weekly.find(w =>
        w.dayOfWeek === date.weekday % 7 && w.isActive
      )?.slots ||
      [];

    for (const slot of daySlots) {
      const hourStartUTC = DateTime
        .fromObject(
          { year: date.year, month: date.month, day: date.day, hour: slot.hour },
          { zone: mentor.timezone }
        )
        .toUTC()
        .toJSDate();

      const hourEndUTC = DateTime.fromJSDate(hourStartUTC).plus({ hours: 1 }).toJSDate();

      const bookings = await Booking.find({
        mentor: mentor.user,
        startTimeUTC: { $lt: hourEndUTC },
        endTimeUTC: { $gt: hourStartUTC },
        status: { $in: ['pending', 'confirmed'] }
      });

      const freeWindows = subtractBookings(hourStartUTC, hourEndUTC, bookings);

      freeWindows.forEach(([start, end]) => {
        let cursor = DateTime.fromJSDate(start);

        while (cursor.plus({ minutes: 15 }) <= DateTime.fromJSDate(end)) {
          const durations = [];
          if (cursor.plus({ minutes: 15 }) <= DateTime.fromJSDate(end)) durations.push(15);
          if (cursor.plus({ minutes: 30 }) <= DateTime.fromJSDate(end)) durations.push(30);
          if (cursor.plus({ minutes: 60 }) <= DateTime.fromJSDate(end)) durations.push(60);

          // Convert to mentee timezone and get the actual date for this time
          const menteeDateTime = cursor.setZone(menteeTimezone);
          const menteeDate = menteeDateTime.toISODate(); // This gives us the correct date in mentee's timezone

          // Initialize the date array if it doesn't exist
          if (!availabilityByDate.has(menteeDate)) {
            availabilityByDate.set(menteeDate, []);
          }

          // Add the slot to the correct date
          availabilityByDate.get(menteeDate).push({
            start: menteeDateTime.toFormat('HH:mm'),
            durations
          });

          cursor = cursor.plus({ minutes: 15 });
        }
      });
    }
  }

  // Convert Map to array format
  const availability = Array.from(availabilityByDate.entries())
    .map(([date, slots]) => ({
      date,
      slots
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

  res.json({ success: true, availability });
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

    // Return raw availability data for mentor's own view
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
