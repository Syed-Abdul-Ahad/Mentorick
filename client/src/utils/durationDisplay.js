/**
 * Presentation-only duration helpers for the frontend.
 * Booking rules and duration catalogs live on the backend.
 */

export function formatDurationLabel(minutes) {
  if (minutes === null || minutes === undefined || minutes === '') return '';
  const value = typeof minutes === 'number'
    ? minutes
    : parseInt(String(minutes).replace(/\D/g, ''), 10);
  return Number.isFinite(value) ? `${value} min` : '';
}

export function getDurationDescription(minutes) {
  const value = typeof minutes === 'number'
    ? minutes
    : parseInt(String(minutes).replace(/\D/g, ''), 10);

  const descriptions = {
    15: 'Quick consultation',
    30: 'Standard session',
    60: 'Deep dive session',
    90: 'Extended session',
  };

  return descriptions[value] || 'Session';
}
