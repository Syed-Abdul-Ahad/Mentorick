const { DateTime } = require('luxon');
const { DEFAULT_AVAILABILITY_DAYS, ALL_DURATIONS } = require('./constants');
const { parseDurationMinutes, isValidDuration } = require('./duration');
const { generateAvailability } = require('./availabilityEngine');
const { findOverlappingBooking } = require('./overlap');
const { resolvePrice } = require('./pricing');

function parseBookingWindow(startTimeISO, durationMinutes, requestTimezone) {
  const startUTC = DateTime.fromISO(startTimeISO, { zone: requestTimezone }).toUTC();
  const endUTC = startUTC.plus({ minutes: durationMinutes });

  return {
    startUTC: startUTC.toJSDate(),
    endUTC: endUTC.toJSDate(),
    menteeDate: DateTime.fromISO(startTimeISO, { zone: requestTimezone }).toISODate(),
    startLocal: DateTime.fromISO(startTimeISO, { zone: requestTimezone }).toFormat('HH:mm'),
  };
}

function validateBookableSlot({
  mentorProfile,
  bookings,
  startTimeISO,
  durationMinutes,
  requestTimezone,
}) {
  const normalizedDuration = parseDurationMinutes(durationMinutes);

  if (!isValidDuration(normalizedDuration)) {
    return { valid: false, reason: `Invalid duration. Must be one of: ${ALL_DURATIONS.join(', ')} minutes` };
  }

  const window = parseBookingWindow(startTimeISO, normalizedDuration, requestTimezone);
  const availability = generateAvailability({
    mentorProfile,
    bookings,
    menteeTimezone: requestTimezone,
    daysAhead: DEFAULT_AVAILABILITY_DAYS,
  });

  const dayAvailability = availability.find((day) => day.date === window.menteeDate);
  const matchingSlot = dayAvailability?.slots.find((slot) => slot.start === window.startLocal);

  if (!matchingSlot) {
    return { valid: false, reason: 'Selected time is not available' };
  }

  if (!matchingSlot.durations.includes(normalizedDuration)) {
    return {
      valid: false,
      reason: `Session duration of ${normalizedDuration} minutes is not available for this time slot`,
    };
  }

  return {
    valid: true,
    durationMinutes: normalizedDuration,
    startUTC: window.startUTC,
    endUTC: window.endUTC,
    menteeDate: window.menteeDate,
    startLocal: window.startLocal,
  };
}

function validateCreateBooking({
  mentorProfile,
  bookings,
  startTimeISO,
  duration,
  timezone,
  currency,
  requirePayPalConnected = true,
}) {
  if (requirePayPalConnected && !mentorProfile.paypal?.isConnected) {
    return { valid: false, reason: 'Mentor has not connected PayPal account', statusCode: 400 };
  }

  const slotValidation = validateBookableSlot({
    mentorProfile,
    bookings,
    startTimeISO,
    durationMinutes: duration,
    requestTimezone: timezone,
  });

  if (!slotValidation.valid) {
    return { valid: false, reason: slotValidation.reason, statusCode: 400 };
  }

  const { startUTC, endUTC, durationMinutes } = slotValidation;

  const overlap = findOverlappingBooking(bookings, startUTC, endUTC);
  if (overlap) {
    return { valid: false, reason: 'Slot already booked', statusCode: 409 };
  }

  const price = resolvePrice(mentorProfile.sessionDurations, durationMinutes, currency);
  if (!price) {
    return {
      valid: false,
      reason: `Session duration of ${durationMinutes} minutes is not available for this mentor`,
      statusCode: 400,
    };
  }

  return {
    valid: true,
    startUTC,
    endUTC,
    durationMinutes,
    price,
  };
}

function validateCreateMegaSession({
  mentorProfile,
  bookings,
  startTimeISO,
  duration,
  timezone,
  currency,
}) {
  const slotValidation = validateBookableSlot({
    mentorProfile,
    bookings,
    startTimeISO,
    durationMinutes: duration,
    requestTimezone: timezone,
  });

  if (!slotValidation.valid) {
    return { valid: false, reason: slotValidation.reason, statusCode: 400 };
  }

  const { startUTC, endUTC, durationMinutes } = slotValidation;

  const overlap = findOverlappingBooking(bookings, startUTC, endUTC);
  if (overlap) {
    return {
      valid: false,
      reason: 'Time slot conflicts with existing booking',
      statusCode: 409,
      overlap,
    };
  }

  const price = resolvePrice(mentorProfile.sessionDurations, durationMinutes, currency);
  if (!price) {
    return {
      valid: false,
      reason: `Session duration of ${durationMinutes} minutes is not available for this mentor`,
      statusCode: 400,
    };
  }

  return {
    valid: true,
    startUTC,
    endUTC,
    durationMinutes,
    price,
  };
}

module.exports = {
  parseBookingWindow,
  validateBookableSlot,
  validateCreateBooking,
  validateCreateMegaSession,
};
