const { DateTime } = require('luxon');

/**
 * Converts stored hourly availability into continuous mentor-local windows.
 * Hour N represents [N:00, N+1:00). Consecutive hours merge; gaps stay separate.
 */
function mergeConsecutiveHoursToWindows(hours, date, mentorTimezone) {
  if (!hours.length) return [];

  const windows = [];
  let rangeStart = hours[0];
  let rangeEnd = hours[0];

  const flushRange = () => {
    const startUTC = DateTime.fromObject(
      {
        year: date.year,
        month: date.month,
        day: date.day,
        hour: rangeStart,
        minute: 0,
        second: 0,
        millisecond: 0,
      },
      { zone: mentorTimezone }
    ).toUTC();

    const endUTC = DateTime.fromObject(
      {
        year: date.year,
        month: date.month,
        day: date.day,
        hour: rangeEnd + 1,
        minute: 0,
        second: 0,
        millisecond: 0,
      },
      { zone: mentorTimezone }
    ).toUTC();

    windows.push({
      startUTC: startUTC.toJSDate(),
      endUTC: endUTC.toJSDate(),
    });
  };

  for (let index = 1; index < hours.length; index += 1) {
    const hour = hours[index];
    if (hour === rangeEnd + 1) {
      rangeEnd = hour;
    } else {
      flushRange();
      rangeStart = hour;
      rangeEnd = hour;
    }
  }

  flushRange();
  return windows;
}

/**
 * Removes booked intervals from continuous windows, producing smaller free windows.
 * Slot generation runs independently inside each resulting free window.
 */
function subtractBookingsFromWindows(windows, bookings) {
  let freeWindows = windows.map((window) => [window.startUTC, window.endUTC]);

  for (const booking of bookings) {
    const bookingStart = new Date(booking.startTimeUTC);
    const bookingEnd = new Date(booking.endTimeUTC);

    freeWindows = freeWindows.flatMap(([start, end]) => {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (bookingEnd <= startDate || bookingStart >= endDate) {
        return [[start, end]];
      }

      const segments = [];
      if (bookingStart > startDate) {
        segments.push([start, bookingStart]);
      }
      if (bookingEnd < endDate) {
        segments.push([bookingEnd, endDate]);
      }
      return segments;
    });
  }

  return freeWindows
    .filter(([start, end]) => new Date(end) > new Date(start))
    .map(([start, end]) => ({ startUTC: new Date(start), endUTC: new Date(end) }));
}

module.exports = {
  mergeConsecutiveHoursToWindows,
  subtractBookingsFromWindows,
};
