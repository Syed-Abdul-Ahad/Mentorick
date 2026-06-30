const { ALL_DURATIONS } = require('./constants');

function parseDurationMinutes(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const parsed = parseInt(String(value).replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidDuration(minutes) {
  return ALL_DURATIONS.includes(minutes);
}

function getMentorSupportedDurations(sessionDurations) {
  if (!Array.isArray(sessionDurations)) return [];

  const supported = sessionDurations
    .map((entry) => parseDurationMinutes(entry?.duration ?? entry))
    .filter((minutes) => minutes !== null && isValidDuration(minutes));

  return [...new Set(supported)].sort((a, b) => a - b);
}

function formatDurationLabel(minutes) {
  const normalized = parseDurationMinutes(minutes);
  return normalized ? `${normalized} min` : '';
}

function filterSupportedDurations(feasibleDurations, supportedDurations) {
  const supported = new Set(supportedDurations);
  return feasibleDurations.filter((duration) => supported.has(duration));
}

function deriveFeasibleDurations(windowStart, windowEnd, supportedDurations) {
  const feasible = ALL_DURATIONS.filter((duration) => {
    const sessionEnd = windowStart.plus({ minutes: duration });
    return sessionEnd <= windowEnd;
  });

  return filterSupportedDurations(feasible, supportedDurations);
}

module.exports = {
  parseDurationMinutes,
  isValidDuration,
  getMentorSupportedDurations,
  formatDurationLabel,
  filterSupportedDurations,
  deriveFeasibleDurations,
};
