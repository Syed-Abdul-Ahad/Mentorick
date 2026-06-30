/** @readonly Supported session length options (minutes). Single source of truth. */
const ALL_DURATIONS = Object.freeze([15, 30, 60, 90]);

const SLOT_STEP_MINUTES = 15;

const ACTIVE_BOOKING_STATUSES = Object.freeze(['pending', 'confirmed']);

const DEFAULT_AVAILABILITY_DAYS = 14;

module.exports = {
  ALL_DURATIONS,
  SLOT_STEP_MINUTES,
  ACTIVE_BOOKING_STATUSES,
  DEFAULT_AVAILABILITY_DAYS,
};
