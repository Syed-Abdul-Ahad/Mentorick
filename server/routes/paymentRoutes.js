const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { paymentProofUpload } = require('../middleware/uploadHeadshot');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.get('/bank-details', authenticate, paymentController.getBankDetails);

router.get(
  '/pending-verifications',
  authenticate,
  authorize('admin'),
  paymentController.getPendingVerifications
);

router.post(
  '/bookings/:id/proof',
  authenticate,
  [param('id').isMongoId().withMessage('Valid booking ID is required')],
  validateRequest,
  ...paymentProofUpload(),
  paymentController.uploadPaymentProof
);

router.post(
  '/bookings/:id/verify',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Valid booking ID is required')],
  validateRequest,
  paymentController.verifyPayment
);

router.post(
  '/bookings/:id/reject',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Valid booking ID is required'),
    body('reason').optional().isString().trim(),
  ],
  validateRequest,
  paymentController.rejectPayment
);

module.exports = router;
