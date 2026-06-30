const { parseDurationMinutes } = require('./duration');

function resolvePrice(sessionDurations, durationMinutes, currency) {
  const normalizedDuration = parseDurationMinutes(durationMinutes);
  if (normalizedDuration === null) return null;

  const priceInfo = sessionDurations.find(
    (entry) => parseDurationMinutes(entry.duration) === normalizedDuration
  );

  if (!priceInfo) return null;

  const amount = priceInfo[`price${currency}`];
  if (amount === undefined || amount === null) return null;

  return {
    amount,
    durationMinutes: normalizedDuration,
  };
}

module.exports = {
  resolvePrice,
};
