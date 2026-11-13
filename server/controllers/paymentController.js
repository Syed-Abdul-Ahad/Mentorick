const Booking = require('../models/Booking');
const { DateTime } = require('luxon');
const {
  createCalendarEvent,
  createMegaSessionCalendarEvent,
  updateMegaSessionAttendees,
} = require('../utils/calendar.util');
const sendEmailWithResend = require('../utils/email');
const {
  getBankDetails,
  buildWhatsAppDeepLink,
} = require('../utils/paymentConfig');
const { expireUnpaidProofBookings } = require('../services/paymentExpiryService');

const sendError = (res, statusCode, message, extra = {}) =>
  res.status(statusCode).json({ status: 'error', message, ...extra });

const formatPersonName = (person) => {
  if (!person) return null;
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || null;
};

const buildBookingConfirmationDetails = (booking, recipientFirstName) => {
  const timezone = booking.menteeTimezone || booking.mentorTimezone || 'UTC';
  let sessionDate = null;
  let sessionTime = null;

  if (booking.startTimeUTC) {
    const start = DateTime.fromJSDate(new Date(booking.startTimeUTC)).setZone(timezone);
    if (start.isValid) {
      sessionDate = start.toFormat('cccc, LLLL d, yyyy');
      sessionTime = start.toFormat('h:mm a');
      if (booking.endTimeUTC) {
        const end = DateTime.fromJSDate(new Date(booking.endTimeUTC)).setZone(timezone);
        if (end.isValid) {
          sessionTime = `${sessionTime} – ${end.toFormat('h:mm a')}`;
        }
      }
    }
  }

  return {
    firstName: recipientFirstName || 'there',
    mentorName: formatPersonName(booking.mentor),
    menteeName: formatPersonName(booking.mentee),
    sessionDate,
    sessionTime,
    timezone,
    duration: booking.durationMinutes ? `${booking.durationMinutes} minutes` : null,
    meetingLink: booking.meeting?.meetingLink || null,
    bookingId: booking._id ? booking._id.toString() : null,
  };
};

const sendBookingConfirmationEmails = async (booking) => {
  if (booking.status !== 'confirmed' || booking.payment?.status !== 'paid') {
    return;
  }

  const recipients = [];
  if (booking.mentee?.email) {
    recipients.push({
      email: booking.mentee.email,
      firstName: booking.mentee.firstName || 'there',
    });
  }
  if (booking.mentor?.email) {
    recipients.push({
      email: booking.mentor.email,
      firstName: booking.mentor.firstName || 'there',
    });
  }

  for (const recipient of recipients) {
    const bookingDetails = buildBookingConfirmationDetails(booking, recipient.firstName);
    const summaryLines = [
      bookingDetails.mentorName && `Mentor: ${bookingDetails.mentorName}`,
      bookingDetails.menteeName && `Mentee: ${bookingDetails.menteeName}`,
      bookingDetails.sessionDate && `Date: ${bookingDetails.sessionDate}`,
      bookingDetails.sessionTime && `Time: ${bookingDetails.sessionTime}`,
      bookingDetails.timezone && `Timezone: ${bookingDetails.timezone}`,
      bookingDetails.duration && `Duration: ${bookingDetails.duration}`,
      bookingDetails.meetingLink && `Meeting link: ${bookingDetails.meetingLink}`,
      bookingDetails.bookingId && `Booking ID: ${bookingDetails.bookingId}`,
    ].filter(Boolean);

    await sendEmailWithResend({
      email: recipient.email,
      subject: 'Booking Confirmed – Mentorick',
      isBookingConfirmation: true,
      bookingDetails,
      message: `
Your mentorship session has been confirmed.

${summaryLines.join('\n')}

Thank you for choosing Mentorick.
      `.trim(),
    });
  }
};

const sendBookingConfirmationEmailsSafely = async (booking) => {
  try {
    await sendBookingConfirmationEmails(booking);
  } catch (emailError) {
    console.error(
      `Failed to send booking confirmation email for booking ${booking?._id}:`,
      emailError
    );
  }
};

const sanitizeMeetingForViewer = (bookingObj, viewerRole) => {
  if (!bookingObj) return bookingObj;
  if (bookingObj.status === 'confirmed' && bookingObj.payment?.status === 'paid') {
    return bookingObj;
  }
  // Hide Meet link until admin-confirmed (especially from mentees)
  if (viewerRole !== 'admin') {
    return {
      ...bookingObj,
      meeting: {
        ...(bookingObj.meeting || {}),
        meetingLink: undefined,
        calendarEventId: undefined,
      },
    };
  }
  return bookingObj;
};

exports.getBankDetails = async (req, res) => {
  try {
    await expireUnpaidProofBookings();
    return res.status(200).json({
      success: true,
      bankDetails: getBankDetails(),
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return sendError(res, 500, 'Failed to load bank details');
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    await expireUnpaidProofBookings();

    const { id } = req.params;
    const proofUrl = req.file?.cloudinaryUrl;

    if (!proofUrl) {
      return sendError(res, 400, 'Payment screenshot is required');
    }

    const booking = await Booking.findById(id)
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email');

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    if (!booking.mentee || booking.mentee._id.toString() !== req.user.id.toString()) {
      return sendError(res, 403, 'You are not allowed to upload proof for this booking');
    }

    if (booking.status !== 'pending') {
      return sendError(res, 400, 'Only pending bookings can receive payment proof');
    }

    const paymentStatus = booking.payment?.status;
    // Re-upload after reject is not supported: reject cancels the booking and frees the slot.
    if (paymentStatus !== 'awaiting_proof') {
      return sendError(res, 400, `Cannot upload proof while payment status is ${paymentStatus}`);
    }

    if (booking.payment?.proofDueAt && new Date() > new Date(booking.payment.proofDueAt)) {
      booking.status = 'cancelled';
      booking.payment.status = 'expired';
      await booking.save();
      return sendError(res, 400, 'Payment proof window has expired. Please book again.');
    }

    booking.payment.proofImageUrl = proofUrl;
    booking.payment.proofUploadedAt = new Date();
    booking.payment.status = 'awaiting_verification';
    booking.payment.rejectionReason = undefined;
    await booking.save();

    const whatsappUrl = buildWhatsAppDeepLink({
      booking,
      proofImageUrl: proofUrl,
      mentorName: formatPersonName(booking.mentor),
      menteeName: formatPersonName(booking.mentee),
    });

    return res.status(200).json({
      success: true,
      message: 'Payment proof uploaded. Waiting for admin verification.',
      booking: sanitizeMeetingForViewer(booking.toObject(), 'mentee'),
      whatsappUrl,
      bankDetails: getBankDetails(),
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return sendError(res, 500, error.message || 'Failed to upload payment proof');
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;

    let booking = await Booking.findById(id)
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email');

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    if (booking.status === 'confirmed' && booking.payment?.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Booking already confirmed',
        booking,
      });
    }

    if (booking.status !== 'pending') {
      return sendError(res, 400, 'Only pending bookings can be verified');
    }

    if (booking.payment?.status !== 'awaiting_verification') {
      return sendError(res, 400, 'Payment proof has not been submitted for verification');
    }

    // Confirm payment first
    booking.payment.status = 'paid';
    booking.payment.verifiedAt = new Date();
    booking.payment.verifiedBy = req.user._id;

    // Create / attach meeting link
    try {
      if (booking.parentMegaSession) {
        const megaSession = await Booking.findById(booking.parentMegaSession)
          .populate('mentor', 'email firstName lastName');

        if (!megaSession) {
          return sendError(res, 404, 'Parent mega session not found');
        }

        if (!megaSession.participants.some((p) => p.toString() === booking.mentee._id.toString())) {
          megaSession.participants.push(booking.mentee._id);
        }

        if (!megaSession.meeting?.calendarEventId && megaSession.mentor?.email) {
          const megaEvent = await createMegaSessionCalendarEvent({
            mentorId: megaSession.mentor._id,
            mentorEmail: megaSession.mentor.email,
            startUTC: megaSession.startTimeUTC,
            endUTC: megaSession.endTimeUTC,
            title: megaSession.title || 'Mega Mentorship Session',
            description: megaSession.description || 'Group mentorship session',
          });
          megaSession.meeting = {
            provider: 'google',
            meetingLink: megaEvent.meetingLink,
            calendarEventId: megaEvent.calendarEventId,
          };
          if (megaSession.status === 'pending') {
            megaSession.status = 'confirmed';
          }
        }

        await megaSession.save();

        if (megaSession.meeting?.calendarEventId) {
          const participantUsers = await require('../models/User').find({
            _id: { $in: megaSession.participants },
          }).select('email');

          const attendeeEmails = [
            megaSession.mentor?.email,
            ...participantUsers.map((u) => u.email),
            booking.mentee?.email,
          ].filter(Boolean);

          await updateMegaSessionAttendees({
            mentorId: megaSession.mentor._id,
            calendarEventId: megaSession.meeting.calendarEventId,
            attendeeEmails,
            title: megaSession.title,
            description: megaSession.description,
          });
        }

        booking.meeting = megaSession.meeting;
      } else if (!booking.isMegaSession) {
        if (booking.mentor?.email && booking.mentee?.email) {
          const calendarEvent = await createCalendarEvent({
            mentorId: booking.mentor._id,
            mentorEmail: booking.mentor.email,
            menteeEmail: booking.mentee.email,
            startUTC: booking.startTimeUTC,
            endUTC: booking.endTimeUTC,
          });
          booking.meeting = {
            provider: 'google',
            meetingLink: calendarEvent.meetingLink,
            calendarEventId: calendarEvent.calendarEventId,
          };
        }
      }
    } catch (calendarError) {
      console.error('Calendar creation failed during verify:', calendarError);
      // Still confirm booking; meeting can be repaired later
    }

    booking.status = 'confirmed';
    await booking.save();

    await sendBookingConfirmationEmailsSafely(booking);

    booking = await Booking.findById(id)
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email');

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return sendError(res, 500, error.message || 'Failed to verify payment');
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const booking = await Booking.findById(id)
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email');

    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    if (booking.status !== 'pending') {
      return sendError(res, 400, 'Only pending bookings can be rejected');
    }

    if (booking.payment?.status !== 'awaiting_verification') {
      return sendError(res, 400, 'No payment proof awaiting verification');
    }

    // Reject proof AND release the slot — pending bookings block availability,
    // so keeping status=pending after reject would hide the slot forever.
    booking.payment.status = 'rejected';
    booking.payment.rejectionReason = reason || 'Payment proof rejected';
    booking.status = 'cancelled';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Payment proof rejected. Slot released — mentee can book again.',
      booking: sanitizeMeetingForViewer(booking.toObject(), 'admin'),
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return sendError(res, 500, error.message || 'Failed to reject payment');
  }
};

exports.getPendingVerifications = async (req, res) => {
  try {
    await expireUnpaidProofBookings();

    const bookings = await Booking.find({
      status: 'pending',
      'payment.status': 'awaiting_verification',
    })
      .populate('mentor', 'firstName lastName email')
      .populate('mentee', 'firstName lastName email')
      .sort({ 'payment.proofUploadedAt': 1 });

    return res.status(200).json({
      success: true,
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error listing pending verifications:', error);
    return sendError(res, 500, 'Failed to load pending verifications');
  }
};

module.exports.sanitizeMeetingForViewer = sanitizeMeetingForViewer;
module.exports.sendBookingConfirmationEmailsSafely = sendBookingConfirmationEmailsSafely;
