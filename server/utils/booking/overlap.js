const { ACTIVE_BOOKING_STATUSES } = require('./constants');

function findOverlappingBooking(bookings, startUTC, endUTC, activeStatuses = ACTIVE_BOOKING_STATUSES) {
  const statuses = new Set(activeStatuses);

  return bookings.find((booking) => {
    if (booking.status && !statuses.has(booking.status)) return false;

    return (
      new Date(booking.startTimeUTC) < endUTC
      && new Date(booking.endTimeUTC) > startUTC
    );
  }) || null;
}

function findExactBooking(bookings, {
  mentorId,
  menteeId,
  startUTC,
  endUTC,
  durationMinutes,
  activeStatuses = ACTIVE_BOOKING_STATUSES,
}) {
  const statuses = new Set(activeStatuses);

  return bookings.find((booking) => {
    if (booking.status && !statuses.has(booking.status)) return false;
    if (mentorId && String(booking.mentor) !== String(mentorId)) return false;
    if (menteeId && String(booking.mentee) !== String(menteeId)) return false;

    return (
      new Date(booking.startTimeUTC).getTime() === startUTC.getTime()
      && new Date(booking.endTimeUTC).getTime() === endUTC.getTime()
      && booking.durationMinutes === durationMinutes
    );
  }) || null;
}

module.exports = {
  findOverlappingBooking,
  findExactBooking,
};
