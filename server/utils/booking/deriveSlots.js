const { DateTime } = require('luxon');
const { SLOT_STEP_MINUTES } = require('./constants');
const { deriveFeasibleDurations } = require('./duration');

function deriveBookableSlots(windows, supportedDurations, menteeTimezone, stepMinutes = SLOT_STEP_MINUTES) {
  const slots = [];

  for (const window of windows) {
    let cursor = DateTime.fromJSDate(window.startUTC, { zone: 'utc' });
    const windowEnd = DateTime.fromJSDate(window.endUTC, { zone: 'utc' });

    while (cursor.plus({ minutes: stepMinutes }) <= windowEnd) {
      const durations = deriveFeasibleDurations(cursor, windowEnd, supportedDurations);

      if (durations.length > 0) {
        const menteeDateTime = cursor.setZone(menteeTimezone);
        slots.push({
          startUTC: cursor.toJSDate(),
          startLocal: menteeDateTime.toFormat('HH:mm'),
          date: menteeDateTime.toISODate(),
          durations,
        });
      }

      cursor = cursor.plus({ minutes: stepMinutes });
    }
  }

  return slots;
}

function groupSlotsForApi(slots) {
  const byDate = new Map();

  for (const slot of slots) {
    if (!byDate.has(slot.date)) {
      byDate.set(slot.date, []);
    }

    byDate.get(slot.date).push({
      start: slot.startLocal,
      durations: slot.durations,
    });
  }

  return [...byDate.entries()]
    .map(([date, daySlots]) => ({
      date,
      slots: daySlots.sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = {
  deriveBookableSlots,
  groupSlotsForApi,
};
