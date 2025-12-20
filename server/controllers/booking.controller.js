const MentorProfile = require('../models/MentorProfile');
const Booking = require('../models/Booking');
const { DateTime } = require('luxon');

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
