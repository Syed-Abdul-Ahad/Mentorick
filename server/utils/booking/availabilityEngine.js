const { DateTime } = require('luxon');
const { DEFAULT_AVAILABILITY_DAYS, ACTIVE_BOOKING_STATUSES } = require('./constants');
const { getMentorSupportedDurations } = require('./duration');
const { isDateBlocked, resolveDayHourSlots } = require('./resolveDaySlots');
const { mergeConsecutiveHoursToWindows, subtractBookingsFromWindows } = require('./windows');
const { deriveBookableSlots, groupSlotsForApi } = require('./deriveSlots');

function filterBookingsInRange(bookings, rangeStartUTC, rangeEndUTC, activeStatuses = ACTIVE_BOOKING_STATUSES) {
  const statuses = new Set(activeStatuses);
  return bookings.filter((booking) => {
    if (statuses.size > 0 && booking.status && !statuses.has(booking.status)) {
      return false;
    }

    return (
      new Date(booking.startTimeUTC) < rangeEndUTC
      && new Date(booking.endTimeUTC) > rangeStartUTC
    );
  });
}

/**
 * Availability pipeline (hours are input format only; all downstream logic uses windows):
 *
 * 1. resolveDayHourSlots     — weekly / date-specific hours for a calendar day
 * 2. mergeConsecutiveHoursToWindows — consecutive hours → continuous UTC windows
 * 3. subtractBookingsFromWindows    — split windows around existing bookings
 * 4. deriveBookableSlots            — 15-min starts + feasible durations per free window
 * 5. groupSlotsForApi               — group by mentee-local date for API response
 */
function generateAvailability({
  mentorProfile,
  bookings,
  menteeTimezone,
  daysAhead = DEFAULT_AVAILABILITY_DAYS,
  startFrom = DateTime.now(),
}) {
  const mentorTimezone = mentorProfile.timezone;
  const supportedDurations = getMentorSupportedDurations(mentorProfile.sessionDurations);
  const availability = mentorProfile.availability || {};
  const unavailability = availability.unavailability || [];

  if (supportedDurations.length === 0) {
    return [];
  }

  const mentorNow = startFrom.setZone(mentorTimezone).startOf('day');
  const allSlots = [];

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const date = mentorNow.plus({ days: dayOffset });

    if (isDateBlocked(date.toJSDate(), unavailability)) {
      continue;
    }

    const hours = resolveDayHourSlots(availability, date);
    if (!hours.length) continue;

    const windows = mergeConsecutiveHoursToWindows(hours, date, mentorTimezone);
    if (!windows.length) continue;

    const dayStartUTC = windows[0].startUTC;
    const dayEndUTC = windows[windows.length - 1].endUTC;
    const dayBookings = filterBookingsInRange(bookings, dayStartUTC, dayEndUTC);

    const freeWindows = subtractBookingsFromWindows(windows, dayBookings);
    const daySlots = deriveBookableSlots(freeWindows, supportedDurations, menteeTimezone);
    allSlots.push(...daySlots);
  }

  return groupSlotsForApi(allSlots);
}

module.exports = {
  generateAvailability,
  filterBookingsInRange,
};
