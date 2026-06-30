const { DateTime } = require('luxon');

function isDateBlocked(date, unavailability) {
  if (!Array.isArray(unavailability) || unavailability.length === 0) return false;

  return unavailability.some((range) => {
    const from = new Date(range.from);
    const to = new Date(range.to);
    return date >= from && date <= to;
  });
}

function resolveDayHourSlots(availability, date) {
  const weekly = availability?.weekly || [];
  const specificDates = availability?.specificDates || [];

  const specificMatch = specificDates.find((entry) =>
    DateTime.fromJSDate(new Date(entry.date)).hasSame(date, 'day')
  );

  const slots = specificMatch?.slots
    || weekly.find((entry) => entry.dayOfWeek === date.weekday % 7 && entry.isActive)?.slots
    || [];

  const hours = [...new Set(slots.map((slot) => slot.hour))].sort((a, b) => a - b);
  return hours.filter((hour) => hour >= 0 && hour <= 23);
}

module.exports = {
  isDateBlocked,
  resolveDayHourSlots,
};
