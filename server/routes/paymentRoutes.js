const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post(
  '/orders',
  authenticate,
  [body('bookingId').isMongoId().withMessage('Valid booking ID is required')],
  validateRequest,
  paymentController.createOrder
);

router.post(
  '/orders/capture',
  authenticate,
  [
    body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
    body('orderId').notEmpty().withMessage('PayPal order ID is required')
  ],
  validateRequest,
  paymentController.captureOrder
);

// PayPal Connect Flow
router.get('/connect', authenticate, paymentController.connectPayPal);
router.get('/connect/callback', paymentController.connectPayPalCallback); // Public callback (secured on backend via Merchant Integrations verification)
router.get('/verify-merchant', authenticate, paymentController.verifyMerchant); // Manual verification fallback (GET)
router.post('/verify-merchant', authenticate, paymentController.verifyMerchant); // Manual verification fallback (POST)

// Webhook
router.post('/webhook', paymentController.paypalWebhook);

module.exports = router;