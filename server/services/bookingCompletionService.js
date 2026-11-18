const Booking = require('../models/Booking');

/**
 * Mark sessions as completed once their end time has passed.
 *
 * Rules (narrow + safe):
 * - Only `confirmed` → `completed` when `endTimeUTC < now`
 * - Does NOT touch pending (unpaid / awaiting admin) — those are not real sessions
 * - Does NOT touch cancelled / no-show / already completed
 * - Includes 1:1, mega parents, and paid mega child bookings
 * - Idempotent (updateMany only matches confirmed)
 *
 * Why endTimeUTC (not start): a 60m session booked for 1:00 stays joinable until 2:00.
 */
async function completePastConfirmedBookings() {
  const now = new Date();

  const result = await Booking.updateMany(
    {
      status: 'confirmed',
      endTimeUTC: { $lt: now },
    },
    {
      $set: {
        status: 'completed',
      },
    }
  );

  const modified = result.modifiedCount ?? result.nModified ?? 0;
  if (modified > 0) {
    console.log(`[bookingCompletion] Marked ${modified} past session(s) as completed`);
  }

  return modified;
}

function startBookingCompletionScheduler(intervalMs = 60 * 1000) {
  completePastConfirmedBookings().catch((err) => {
    console.error('[bookingCompletion] Initial sweep failed:', err.message);
  });

  const timer = setInterval(() => {
    completePastConfirmedBookings().catch((err) => {
      console.error('[bookingCompletion] Sweep failed:', err.message);
    });
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}

module.exports = {
  completePastConfirmedBookings,
  startBookingCompletionScheduler,
};
