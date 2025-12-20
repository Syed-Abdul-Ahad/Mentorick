exports.subtractBookings = (hourStart, hourEnd, bookings) => {
  let freeSlots = [[hourStart, hourEnd]];

  for (const booking of bookings) {
    freeSlots = freeSlots.flatMap(([start, end]) => {
      if (booking.endTimeUTC <= start || booking.startTimeUTC >= end) {
        return [[start, end]];
      }

      const result = [];
      if (booking.startTimeUTC > start) {
        result.push([start, booking.startTimeUTC]);
      }
      if (booking.endTimeUTC < end) {
        result.push([booking.endTimeUTC, end]);
      }
      return result;
    });
  }

  return freeSlots;
};
