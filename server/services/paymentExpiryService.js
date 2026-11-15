const Booking = require('../models/Booking');

/**
 * Cancel pending bookings that never uploaded payment proof before proofDueAt.
 * Does NOT expire awaiting_verification (admin may still confirm).
 */
async function expireUnpaidProofBookings() {
  const now = new Date();

  const result = await Booking.updateMany(
    {
      status: 'pending',
      'payment.status': 'awaiting_proof',
      'payment.proofDueAt': { $lt: now },
    },
    {
      $set: {
        status: 'cancelled',
        'payment.status': 'expired',
      },
    }
  );

  const modified = result.modifiedCount ?? result.nModified ?? 0;
  if (modified > 0) {
    console.log(`[paymentExpiry] Expired ${modified} booking(s) without payment proof`);
  }

  return modified;
}

function startPaymentExpiryScheduler(intervalMs = 60 * 1000) {
  expireUnpaidProofBookings().catch((err) => {
    console.error('[paymentExpiry] Initial sweep failed:', err.message);
  });

  const timer = setInterval(() => {
    expireUnpaidProofBookings().catch((err) => {
      console.error('[paymentExpiry] Sweep failed:', err.message);
    });
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}

module.exports = {
  expireUnpaidProofBookings,
  startPaymentExpiryScheduler,
};
