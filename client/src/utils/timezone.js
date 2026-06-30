/**
 * Presentation-only timezone helpers for booking UI.
 * Presentation-only timezone helpers for booking UI.
 */

export { getUserTimezone } from './timezoneUtils.js';

/**
 * Convert 24-hour time format to 12-hour format with AM/PM.
 * @param {string} time - Time in HH:mm format
 * @returns {string}
 */
export const formatTimeTo12Hour = (time) => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return time;
  }
};
