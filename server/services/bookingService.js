const { DateTime } = require('luxon');
const Booking = require('../models/Booking');
const MentorProfile = require('../models/MentorProfile');
const {
  generateAvailability,
  validateCreateBooking,
  validateCreateMegaSession,
  parseDurationMinutes,
  parseBookingWindow,
  formatDurationLabel,
  DEFAULT_AVAILABILITY_DAYS,
  ACTIVE_BOOKING_STATUSES,
  ALL_DURATIONS,
} = require('../utils/booking');
const { buildInitialBankPayment, getBankDetails } = require('../utils/paymentConfig');
const { expireUnpaidProofBookings } = require('./paymentExpiryService');
const { completePastConfirmedBookings } = require('./bookingCompletionService');

function loadMentorBookings(mentorUserId, daysAhead = DEFAULT_AVAILABILITY_DAYS) {
  const rangeStart = DateTime.now().toUTC().toJSDate();
  const rangeEnd = DateTime.now().plus({ days: daysAhead }).endOf('day').toUTC().toJSDate();

  return Booking.find({
    mentor: mentorUserId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTimeUTC: { $lt: rangeEnd },
    endTimeUTC: { $gt: rangeStart },
  }).lean();
}

async function getMenteeAvailability(mentorUserId, menteeTimezone) {
  await expireUnpaidProofBookings();
  await completePastConfirmedBookings();

  const mentorProfile = await MentorProfile.findOne({ user: mentorUserId });

  if (!mentorProfile) {
    return { mentorProfile: null, availability: [] };
  }

  const bookings = await loadMentorBookings(mentorUserId);
  const availability = generateAvailability({
    mentorProfile: mentorProfile.toObject ? mentorProfile.toObject() : mentorProfile,
    bookings,
    menteeTimezone,
  });

  return { mentorProfile, availability };
}

async function prepareBooking({ mentorId, startTime, duration, timezone, currency }) {
  const mentorProfile = await MentorProfile.findOne({ user: mentorId });

  if (!mentorProfile) {
    return { ok: false, statusCode: 404, message: 'Mentor not found' };
  }

  const bookings = await loadMentorBookings(mentorId);
  const profileObj = mentorProfile.toObject ? mentorProfile.toObject() : mentorProfile;

  const validation = validateCreateBooking({
    mentorProfile: profileObj,
    bookings,
    startTimeISO: startTime,
    duration,
    timezone,
    currency,
  });

  if (!validation.valid) {
    return { ok: false, statusCode: validation.statusCode || 400, message: validation.reason };
  }

  return {
    ok: true,
    mentorProfile,
    startUTC: validation.startUTC,
    endUTC: validation.endUTC,
    durationMinutes: validation.durationMinutes,
    price: validation.price,
  };
}

async function prepareMegaSession({ mentorId, startTime, duration, timezone, currency }) {
  const mentorProfile = await MentorProfile.findOne({ user: mentorId });

  if (!mentorProfile) {
    return { ok: false, statusCode: 404, message: 'Mentor not found' };
  }

  const bookings = await loadMentorBookings(mentorId);
  const profileObj = mentorProfile.toObject ? mentorProfile.toObject() : mentorProfile;

  const validation = validateCreateMegaSession({
    mentorProfile: profileObj,
    bookings,
    startTimeISO: startTime,
    duration,
    timezone,
    currency,
  });

  if (!validation.valid) {
    return {
      ok: false,
      statusCode: validation.statusCode || 400,
      message: validation.reason,
      overlap: validation.overlap,
    };
  }

  return {
    ok: true,
    mentorProfile,
    startUTC: validation.startUTC,
    endUTC: validation.endUTC,
    durationMinutes: validation.durationMinutes,
    price: validation.price,
  };
}

async function createBookingRecord({
  mentorId,
  menteeId,
  startTime,
  duration,
  timezone,
  currency,
  description,
}) {
  await expireUnpaidProofBookings();

  const durationMinutes = parseDurationMinutes(duration);
  if (durationMinutes === null) {
    return { ok: false, statusCode: 400, message: 'Invalid duration' };
  }

  const { startUTC, endUTC } = parseBookingWindow(startTime, durationMinutes, timezone);

  const exactBooking = await Booking.findOne({
    mentor: mentorId,
    mentee: menteeId,
    startTimeUTC: startUTC,
    endTimeUTC: endUTC,
    durationMinutes,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  if (exactBooking) {
    return {
      ok: true,
      statusCode: 200,
      booking: exactBooking,
      paymentRequired: exactBooking.status !== 'confirmed',
      bankDetails: getBankDetails(),
    };
  }

  const prepared = await prepareBooking({
    mentorId,
    startTime,
    duration,
    timezone,
    currency,
  });

  if (!prepared.ok) {
    return prepared;
  }

  const booking = await Booking.create({
    mentor: mentorId,
    mentee: menteeId,
    mentorProfile: prepared.mentorProfile._id,
    startTimeUTC: prepared.startUTC,
    endTimeUTC: prepared.endUTC,
    durationMinutes: prepared.durationMinutes,
    mentorTimezone: prepared.mentorProfile.timezone,
    menteeTimezone: timezone,
    description,
    price: {
      amount: prepared.price.amount,
      currency,
    },
    payment: buildInitialBankPayment({
      amount: prepared.price.amount,
      currency,
    }),
    status: 'pending',
  });

  return {
    ok: true,
    statusCode: 201,
    booking,
    paymentRequired: true,
    bankDetails: getBankDetails(),
  };
}

async function createMegaSessionRecord({
  mentorId,
  adminId,
  startTime,
  duration,
  timezone,
  currency,
  title,
  description,
  maxParticipants,
}) {
  const prepared = await prepareMegaSession({
    mentorId,
    startTime,
    duration,
    timezone,
    currency,
  });

  if (!prepared.ok) {
    return prepared;
  }

  const megaSession = await Booking.create({
    mentor: mentorId,
    mentorProfile: prepared.mentorProfile._id,
    startTimeUTC: prepared.startUTC,
    endTimeUTC: prepared.endUTC,
    durationMinutes: prepared.durationMinutes,
    mentorTimezone: prepared.mentorProfile.timezone,
    menteeTimezone: timezone,
    isMegaSession: true,
    title: title || 'Mega Mentorship Session',
    description: description || 'Group mentorship session with multiple participants',
    maxParticipants,
    participants: [],
    createdBy: adminId,
    price: {
      amount: prepared.price.amount,
      currency,
    },
    status: 'pending',
  });

  return {
    ok: true,
    statusCode: 201,
    megaSession,
  };
}

function getDurationOptions() {
  return ALL_DURATIONS.map((minutes) => ({
    minutes,
    label: formatDurationLabel(minutes),
  }));
}

module.exports = {
  getMenteeAvailability,
  prepareBooking,
  prepareMegaSession,
  createBookingRecord,
  createMegaSessionRecord,
  loadMentorBookings,
  getDurationOptions,
};
