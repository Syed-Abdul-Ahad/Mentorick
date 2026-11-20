const getPlatformFeeRate = () => {
  const raw = Number(process.env.PLATFORM_FEE_RATE);
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.3;
};

const getPaymentProofMinutes = () => {
  const raw = Number(process.env.PAYMENT_PROOF_MINUTES);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 30;
};

const getBookingMinLeadHours = () => {
  const raw = Number(process.env.BOOKING_MIN_LEAD_HOURS);
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return 24;
};

const computeFeeSplit = (amount) => {
  const gross = Number(amount) || 0;
  const rate = getPlatformFeeRate();
  const platformFee = Math.round(gross * rate * 100) / 100;
  const mentorPayoutAmount = Math.round((gross - platformFee) * 100) / 100;
  return { platformFee, mentorPayoutAmount, feeRate: rate };
};

const buildInitialBankPayment = ({ amount, currency }) => {
  const { platformFee, mentorPayoutAmount } = computeFeeSplit(amount);
  const proofMinutes = getPaymentProofMinutes();
  const proofDueAt = new Date(Date.now() + proofMinutes * 60 * 1000);

  return {
    provider: 'bank_transfer',
    status: 'awaiting_proof',
    amount,
    currency,
    platformFee,
    mentorPayoutAmount,
    proofDueAt,
  };
};

const getBankDetails = () => ({
  accountTitle: process.env.BANK_ACCOUNT_TITLE || '',
  bankName: process.env.BANK_NAME || '',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
  iban: process.env.BANK_IBAN || '',
  branch: process.env.BANK_BRANCH || '',
  proofMinutes: getPaymentProofMinutes(),
  minLeadHours: getBookingMinLeadHours(),
  platformFeeRate: getPlatformFeeRate(),
});

const getWhatsAppSupportNumber = () => {
  const raw = (process.env.WHATSAPP_SUPPORT_NUMBER || '923196943953').replace(/\D/g, '');
  if (raw.startsWith('0') && raw.length === 11) {
    return `92${raw.slice(1)}`;
  }
  return raw || '923196943953';
};

const buildWhatsAppDeepLink = ({ booking, proofImageUrl, mentorName, menteeName }) => {
  const number = getWhatsAppSupportNumber();
  const amount = booking.payment?.amount ?? booking.price?.amount;
  const currency = booking.payment?.currency || booking.price?.currency || 'PKR';
  const when = booking.startTimeUTC
    ? new Date(booking.startTimeUTC).toISOString()
    : '';

  const lines = [
    'Hello Mentorick Support,',
    '',
    'I have booked a mentorship session and transferred the payment.',
    '',
    `Booking ID: ${booking._id}`,
    mentorName ? `Mentor: ${mentorName}` : null,
    menteeName ? `Mentee: ${menteeName}` : null,
    when ? `Session (UTC): ${when}` : null,
    amount != null ? `Amount: ${amount} ${currency}` : null,
    proofImageUrl ? `Payment screenshot: ${proofImageUrl}` : null,
    '',
    'Please verify and confirm my booking. Thank you.',
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${number}?text=${text}`;
};

module.exports = {
  getPlatformFeeRate,
  getPaymentProofMinutes,
  getBookingMinLeadHours,
  computeFeeSplit,
  buildInitialBankPayment,
  getBankDetails,
  getWhatsAppSupportNumber,
  buildWhatsAppDeepLink,
};
