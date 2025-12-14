const { DateTime } = require('luxon');

/**
 * Convert mentor local date + hour → UTC Date
 */
exports.localHourToUTC = (date, hour, timezone) => {
  return DateTime
    .fromISO(date, { zone: timezone })
    .set({ hour, minute: 0, second: 0, millisecond: 0 })
    .toUTC()
    .toJSDate();
};

/**
 * Convert UTC date → mentee timezone hour
 */
exports.utcToLocalHour = (utcDate, timezone) => {
  return DateTime
    .fromJSDate(utcDate)
    .setZone(timezone)
    .hour;
};

/**
 * Check if a date falls inside an unavailability range
 */
exports.isDateBlocked = (date, unavailability) => {
  return unavailability.some(u =>
    date >= u.from && date <= u.to
  );
};
