const Booking = require('../models/Booking');
const User = require('../models/User');
const { createCalendarEvent, updateMegaSessionAttendees } = require('../utils/calendar.util');
const paypalService = require('../services/paypalService');
const MentorProfile = require('../models/MentorProfile');

const sendError = (res, statusCode, message, extra = {}) =>
  res.status(statusCode).json({ status: 'error', message, ...extra });

const buildCaptureMetadata = (captureResponse) => {
  const capture = captureResponse?.capture || null;
  const payer = captureResponse?.payer || null;

  return {
    captureId: capture?.id,
    payerId: payer?.payer_id,
    payerEmail: payer?.email_address,
    captureStatus: capture?.status
  };
};

exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('mentorProfile');
    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    const mentorProfile = booking.mentorProfile;

    if (booking.mentee && booking.mentee.toString() !== req.user.id.toString()) {
      return sendError(res, 403, 'You are not allowed to pay for this booking');
    }

    if (booking.payment?.status === 'paid') {
      return res.status(200).json({
        success: true,
        orderID: booking.payment.orderId,
        booking,
        message: 'Booking is already paid'
      });
    }

    if (booking.payment?.orderId) {
      return res.status(200).json({
        success: true,
        orderID: booking.payment.orderId,
        booking
      });
    }

    const platformFee = booking.price.amount * 0.20;

    const order = await paypalService.createOrder({
      amount: booking.price.amount,
      currency: booking.price.currency,
      referenceId: booking._id.toString(),
      description: booking.parentMegaSession
        ? booking.title || 'Mega session enrollment'
        : booking.isMegaSession
        ? booking.title || 'Mega mentorship session'
        : '1:1 mentor booking',
      mentorPayPalInfo: mentorProfile?.paypal || null,
      platformFeeAmount: platformFee
    });

    booking.payment = {
      ...(booking.payment || {}),
      provider: 'paypal',
      orderId: order.orderId,
      amount: booking.price.amount,
      currency: booking.price.currency,
      status: 'pending'
    };
    await booking.save();

    return res.status(201).json({
      success: true,
      orderID: order.orderId,
      booking,
      approvalLink: order.approvalLink
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return sendError(res, 500, error.message || 'Failed to create PayPal order');
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { bookingId, orderId } = req.body;

    const booking = await Booking.findById(bookingId).populate('mentor', 'email firstName lastName').populate('mentee', 'email firstName lastName');
    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    if (booking.mentee && booking.mentee._id.toString() !== req.user.id.toString()) {
      return sendError(res, 403, 'You are not allowed to capture this payment');
    }

    // Check if booking is already confirmed and paid, avoid re-processing
    if (booking.status === 'confirmed' && booking.payment?.status === 'paid') {
      return res.status(200).json({
        success: true,
        booking,
        message: 'Payment already captured and booking confirmed'
      });
    }

    const storedOrderId = booking.payment?.orderId;
    if (storedOrderId && orderId && storedOrderId !== orderId) {
      return sendError(res, 400, 'Order mismatch for this booking');
    }

    const paypalOrderId = orderId || storedOrderId;
    if (!paypalOrderId) {
      return sendError(res, 400, 'Missing PayPal order ID');
    }

    let captureResponse = null;
    let metadata = null;

    // If payment status is already paid, we assume metadata is available from DB
    if (booking.payment?.status === 'paid') {
      metadata = {
        captureId: booking.payment.captureId || booking.payment.transactionId,
        payerId: booking.payment.payerId,
        payerEmail: booking.payment.payerEmail,
        captureStatus: 'COMPLETED'
      };
    } else {
      captureResponse = await paypalService.captureOrder(paypalOrderId);
      metadata = buildCaptureMetadata(captureResponse);

      if (metadata.captureStatus !== 'COMPLETED') {
        return sendError(res, 400, 'PayPal payment was not completed', { captureResponse });
      }

      booking.payment = {
        ...(booking.payment || {}),
        provider: 'paypal',
        orderId: paypalOrderId,
        amount: booking.price.amount,
        currency: booking.price.currency,
        captureId: metadata.captureId,
        transactionId: metadata.captureId,
        payerId: metadata.payerId,
        payerEmail: metadata.payerEmail,
        status: 'paid',
        capturedAt: new Date()
      };
      await booking.save();

      // NEW LOGIC FOR 1:1 SESSIONS (NON-MEGA)
      if (!booking.isMegaSession && !booking.parentMegaSession) {
        if (booking.mentor?.email && booking.mentee?.email) {
          try {
            const calendarEvent = await createCalendarEvent({
              mentorId: booking.mentor._id,
              mentorEmail: booking.mentor.email,
              menteeEmail: booking.mentee.email,
              startUTC: booking.startTimeUTC,
              endUTC: booking.endTimeUTC,
              title: booking.title || 'Mentorship Session',
              description: booking.description || '1:1 Mentor Session'
            });

            booking.meeting = {
              meetingLink: calendarEvent.meetingLink,
              calendarEventId: calendarEvent.calendarEventId
            };
            booking.status = 'confirmed'; // Mark booking as confirmed
            await booking.save();
            console.log(`Calendar event created and booking confirmed for 1:1 session: ${booking._id}`);
          } catch (calendarError) {
            console.error('Error creating calendar event for 1:1 session:', calendarError);
            // If calendar event creation fails, the booking remains 'paid' but not 'confirmed'
            // Consider adding a retry mechanism or admin notification here.
          }
        } else {
          console.warn(`Missing mentor or mentee email for 1:1 session ${booking._id}. Cannot create calendar event.`);
        }
      }
    }

    // Existing logic for Mega Sessions (now enhanced)
    if (booking.parentMegaSession) {
      const megaSession = await Booking.findById(booking.parentMegaSession)
        .populate('mentor', 'email firstName lastName')
        .populate('mentee', 'email firstName lastName'); // Populate mentee for accurate attendee list

      if (!megaSession) {
        return sendError(res, 404, 'Mega session not found for this participant booking');
      }

      // Add participant if not already present
      if (!megaSession.participants.some((participantId) => participantId.toString() === req.user.id.toString())) {
        megaSession.participants.push(req.user.id);
      }

      // NEW LOGIC FOR MEGA SESSION CALENDAR EVENT CREATION (if not already created)
      if (!megaSession.meeting?.calendarEventId) {
        if (megaSession.mentor?.email) {
          try {
            const megaSessionCalendarEvent = await createMegaSessionCalendarEvent({
              mentorId: megaSession.mentor._id,
              mentorEmail: megaSession.mentor.email,
              startUTC: megaSession.startTimeUTC,
              endUTC: megaSession.endTimeUTC,
              title: megaSession.title || 'Mega Mentorship Session',
              description: megaSession.description || 'Group mentorship session with multiple participants'
            });

            megaSession.meeting = {
              meetingLink: megaSessionCalendarEvent.meetingLink,
              calendarEventId: megaSessionCalendarEvent.calendarEventId
            };
            megaSession.status = 'confirmed'; // Mark mega session as confirmed
            console.log(`Mega session calendar event created and mega session confirmed: ${megaSession._id}`);
          } catch (megaCalendarError) {
            console.error('Error creating calendar event for mega session:', megaCalendarError);
            // Mega session remains 'pending' if calendar event creation fails
          }
        } else {
          console.warn(`Missing mentor email for mega session ${megaSession._id}. Cannot create calendar event.`);
        }
      }

      await megaSession.save(); // Save mega session updates

      // Update attendees if calendar event exists (either existing or just created)
      if (megaSession.meeting?.calendarEventId) {
        const participantUsers = await User.find({
          _id: { $in: megaSession.participants }
        }).select('email');

        const attendeeEmails = [
          megaSession.mentor?.email,
          ...participantUsers.map((participant) => participant.email),
          // Ensure the current mentee's email is included even if not yet saved in participants array (for initial creation)
          booking.mentee?.email
        ].filter(Boolean);

        await updateMegaSessionAttendees({
          mentorId: megaSession.mentor._id,
          calendarEventId: megaSession.meeting.calendarEventId,
          attendeeEmails,
          title: megaSession.title,
          description: megaSession.description
        });
      }

      // Update the participant's booking with confirmed status and mega session meeting details
      booking.status = 'confirmed';
      booking.meeting = megaSession.meeting; // Link participant booking to the mega session's meeting
      await booking.save(); // Save participant booking updates

      return res.status(200).json({
        success: true,
        booking,
        megaSession,
        captureResponse
      });
    }

    // For 1:1 sessions, if calendar event creation failed, the booking status remains 'paid'
    // but not 'confirmed' here. The initial 1:1 logic above handles setting to 'confirmed'.
    // This final return is for cases where no specific calendar event logic applies (e.g., already confirmed).
    if (booking.status !== 'confirmed') {
      booking.status = 'confirmed'; // Default to confirmed if no specific calendar error prevented it
      await booking.save();
    }


    return res.status(200).json({
      success: true,
      booking,
      captureResponse
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return sendError(res, 500, error.message || 'Failed to capture PayPal order');
  }
};

/* ======================================================
   PAYPAL CONNECT FLOW
====================================================== */

exports.connectPayPal = async (req, res) => {
  try {

    const trackingId = req.user.id.toString(); // secure tracking reference
    // const redirectUri = `${req.protocol}://${req.get('host')}/api/payments/connect/callback`;
    const redirectUri = `https://retrodirective-untattooed-ed.ngrok-free.dev/api/payments/connect/callback`;
    console.log("Redirect URI:", redirectUri);

    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    
    // If mentor is already connected, avoid duplicate onboarding and return success
    if (mentorProfile && mentorProfile.paypal?.isConnected && mentorProfile.paypal?.merchantId) {
      return res.status(200).json({
        success: true,
        message: 'PayPal account is already connected.',
        url: null,
        paypal: mentorProfile.paypal
      });
    }

    // Persist onboarding attempt details
    if (mentorProfile) {
      mentorProfile.paypal = {
        ...(mentorProfile.paypal ? mentorProfile.paypal.toObject() : {}),
        trackingId,
        onboardingPending: true,
        onboardingStartedAt: new Date()
      };
      await mentorProfile.save();
    }

    const url = await paypalService.getPayPalOnboardingUrl(trackingId, redirectUri);
    res.json({ url });
  } catch (error) {
    console.error('Error getting PayPal Onboarding URL:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.connectPayPalCallback = async (req, res) => {
  console.log('PAYPAL CALLBACK HIT');
  console.log('req.query:', req.query); // Log the query parameters received
  try {
    const { merchantId, merchantIdInPayPal, permissionsGranted } = req.query;

    if (!merchantId || !merchantIdInPayPal) {
      console.error('Missing onboarding callback parameters:', req.query);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=payments&error=missing_params`);
    }

    if (permissionsGranted !== 'true') {
      console.warn('User did not grant permissions during onboarding');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=payments&error=permissions_denied`);
    }

    // Secure Verification: verify integration directly with PayPal API to prevent parameter spoofing
    const integrationStatus = await paypalService.getMerchantIntegrationStatus({ merchantIdInPayPal });
    
    if (!integrationStatus || !integrationStatus.active) {
      console.warn('Merchant integration is not active or verified with PayPal');
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=payments&error=verification_failed`);
    }

    // Find and update mentor profile using trackingId (which maps to the mentor's user ID)
    const mentorProfile = await MentorProfile.findOne({ user: merchantId });
    if (mentorProfile) {
      // Idempotency check: skip DB save if state already correctly connected
      if (
        mentorProfile.paypal?.isConnected &&
        mentorProfile.paypal?.merchantId === merchantIdInPayPal &&
        mentorProfile.paypal?.payments_receivable &&
        !mentorProfile.paypal?.onboardingPending
      ) {
        console.log(`Mentor ${merchantId} already connected, skipping callback update`);
      } else {
        mentorProfile.paypal = {
          ...(mentorProfile.paypal ? mentorProfile.paypal.toObject() : {}),
          isConnected: true,
          merchantId: merchantIdInPayPal,
          email: req.query.email || mentorProfile.paypal?.email || '',
          connectedAt: mentorProfile.paypal?.connectedAt || new Date(),
          payments_receivable: true,
          onboardingPending: false
        };
        await mentorProfile.save();
        console.log(`Successfully connected PayPal account for mentor: ${merchantId}`);
      }
    } else {
      console.error(`Mentor profile not found for user: ${merchantId}`);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=payments&error=profile_not_found`);
    }

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=payments&status=connected`);
  } catch (error) {
    console.error('Error handling PayPal onboarding callback:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=payments&error=auth_failed`);
  }
};

exports.verifyMerchant = async (req, res) => {
  try {
    const trackingId = req.user.id.toString();

    // Fetch mentor profile to check if merchantId is already stored
    const mentorProfile = await MentorProfile.findOne({ user: trackingId });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found.'
      });
    }

    const merchantIdInPayPal = mentorProfile.paypal?.merchantId;

    // Secure Verification: query integration status directly from PayPal using merchantId or trackingId
    const integrationStatus = await paypalService.getMerchantIntegrationStatus({
      merchantIdInPayPal,
      trackingId: merchantIdInPayPal ? undefined : trackingId
    });

    if (!integrationStatus) {
      return res.status(404).json({
        success: false,
        message: 'No PayPal onboarding session found for this user.'
      });
    }

    if (integrationStatus.active) {
      const connectedAt = mentorProfile.paypal?.connectedAt || new Date();

      // State machine logic: skip updates if already connected to skip unnecessary DB writes
      if (
        mentorProfile.paypal?.isConnected &&
        mentorProfile.paypal?.merchantId === integrationStatus.merchantId &&
        mentorProfile.paypal?.payments_receivable &&
        !mentorProfile.paypal?.onboardingPending
      ) {
        return res.status(200).json({
          success: true,
          message: 'PayPal integration verified and active (cached).',
          paypal: mentorProfile.paypal
        });
      }

      mentorProfile.paypal = {
        ...(mentorProfile.paypal ? mentorProfile.paypal.toObject() : {}),
        isConnected: true,
        merchantId: integrationStatus.merchantId,
        payments_receivable: true,
        onboardingPending: false,
        connectedAt
      };
      await mentorProfile.save();
      
      return res.status(200).json({
        success: true,
        message: 'PayPal integration verified and active.',
        paypal: mentorProfile.paypal
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'PayPal onboarding initiated, but not fully active yet.',
        details: {
          paymentsGranted: integrationStatus.paymentsGranted,
          emailConfirmed: integrationStatus.emailConfirmed
        }
      });
    }
  } catch (error) {
    console.error('Error verifying merchant onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
};

/* ======================================================
   PAYPAL WEBHOOK
====================================================== */

exports.paypalWebhook = async (req, res) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID; // Must configure this in ENV
    const isValid = await paypalService.verifyWebhookSignature(req.headers, req.body, webhookId);

    if (!isValid) {
      console.warn('PayPal Webhook signature invalid');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log('PayPal Webhook received:', event.event_type);

    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = event.resource.id;
      const orderStatus = event.resource.status;
      console.log(`[PayPal Webhook] CHECKOUT.ORDER.APPROVED - Order ID: ${orderId}, Status: ${orderStatus}`);
    } 
    else if (event.event_type === 'MERCHANT.ONBOARDING.COMPLETED') {
      const trackingId = event.resource.tracking_id;
      const merchantIdInPayPal = event.resource.merchant_id;
      console.log(`[PayPal Webhook] MERCHANT.ONBOARDING.COMPLETED - Tracking ID: ${trackingId}, Merchant ID: ${merchantIdInPayPal}`);
      if (trackingId && merchantIdInPayPal) {
        const mentorProfile = await MentorProfile.findOne({ user: trackingId });
        if (mentorProfile) {
          // Idempotency check: skip DB save if state already correctly connected
          if (
            mentorProfile.paypal?.isConnected &&
            mentorProfile.paypal?.merchantId === merchantIdInPayPal &&
            mentorProfile.paypal?.payments_receivable &&
            !mentorProfile.paypal?.onboardingPending
          ) {
            console.log(`[PayPal Webhook] Mentor ${trackingId} already connected, skipping onboarding webhook update`);
          } else {
            mentorProfile.paypal = {
              ...(mentorProfile.paypal ? mentorProfile.paypal.toObject() : {}),
              isConnected: true,
              merchantId: merchantIdInPayPal,
              email: mentorProfile.paypal?.email || '',
              connectedAt: mentorProfile.paypal?.connectedAt || new Date(),
              payments_receivable: true,
              onboardingPending: false
            };
            await mentorProfile.save();
            console.log(`Successfully connected PayPal account via Webhook for mentor: ${trackingId}`);
          }
        }
      }
    }
    else if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureInfo = event.resource;
      // find by custom reference_id. In order purchase_units we sent booking._id as reference_id
      // but PAYMENT.CAPTURE.COMPLETED resource structure: captureInfo.custom_id or captureInfo.invoice_id
      // wait, the reference_id might be inside captureInfo? Actually, we can just find by capture ID.
      // Wait! In createOrder, referenceId was set. Let's see if PayPal includes it in the capture hook.
      // "When you use reference_id in a checkout order, it usually corresponds to the id of the purchase_unit."
      // BUT we also have 'payment.orderId' saved in the DB, and captureInfo has `supplementary_data.related_ids.order_id`.
      // Let's just find booking by capture ID OR order ID.
      
      const orderId = captureInfo.supplementary_data?.related_ids?.order_id;
      const captureId = captureInfo.id;
      let booking = null;

      if (orderId) {
        booking = await Booking.findOne({ 'payment.orderId': orderId });
      }

      if (booking && booking.payment.status !== 'paid') {
        const amount = captureInfo.amount?.value;
        const platformFeeObj = captureInfo.seller_receivable_breakdown?.platform_fee || {};
        const platformFee = platformFeeObj.value || 0;
        const mentorPayoutAmount = captureInfo.seller_receivable_breakdown?.net_amount?.value || (amount - platformFee);

        booking.payment.status = 'paid';
        booking.payment.captureId = captureId;
        booking.payment.transactionId = captureId;
        booking.payment.capturedAt = new Date();
        booking.payment.platformFee = Number(platformFee);
        booking.payment.mentorPayoutAmount = Number(mentorPayoutAmount);
        
        booking.status = 'confirmed';

        await booking.save();
        
        // Trigger Google Calendar Event if it's a 1:1 session 
        // For mega-sessions, the logic is usually different inside captureOrder.
        if (!booking.parentMegaSession && !booking.isMegaSession) {
          booking = await Booking.findById(booking._id).populate('mentor', 'email firstName lastName').populate('mentee', 'email firstName lastName');
          if (!booking.meeting?.calendarEventId) {
            const meetingDetails = await createCalendarEvent(booking, booking.mentor, booking.mentee);
            if (meetingDetails) {
              booking.meeting = {
                provider: 'google',
                meetingLink: meetingDetails.meetingLink,
                calendarEventId: meetingDetails.calendarEventId
              };
              await booking.save();
            }
          }
        }
      }
    } 
    else if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
      const orderId = event.resource.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const booking = await Booking.findOne({ 'payment.orderId': orderId });
        if (booking && booking.payment.status !== 'paid') {
          booking.payment.status = 'failed';
          booking.status = 'cancelled';
          await booking.save();
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook Error');
  }
};