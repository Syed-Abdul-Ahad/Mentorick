import React, { useEffect, useMemo, useState } from 'react';
import Button from '../shared/Button';
import { paymentService } from '../../api';

const formatCountdown = (dueAt) => {
  if (!dueAt) return null;
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Bank transfer instructions + proof upload + WhatsApp handoff.
 * Used after a pending booking is created (1:1 or mega).
 */
const BankTransferPaymentPanel = ({
  booking,
  bankDetails: bankDetailsProp,
  onComplete,
  onCancel,
}) => {
  const [bankDetails, setBankDetails] = useState(bankDetailsProp || null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (bankDetailsProp) {
      setBankDetails(bankDetailsProp);
      return;
    }
    let cancelled = false;
    paymentService
      .getBankDetails()
      .then((res) => {
        if (!cancelled && res?.bankDetails) setBankDetails(res.bankDetails);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bankDetailsProp]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const proofDueAt = booking?.payment?.proofDueAt;
  const countdown = useMemo(() => formatCountdown(proofDueAt), [proofDueAt, nowTick]);
  const expired = proofDueAt && new Date(proofDueAt).getTime() <= Date.now() && !submittedBooking;

  const amount = booking?.payment?.amount ?? booking?.price?.amount;
  const currency = booking?.payment?.currency || booking?.price?.currency || 'PKR';

  const handleUpload = async () => {
    if (!booking?._id) return;
    if (!file) {
      setError('Please select a payment screenshot');
      return;
    }
    if (expired) {
      setError('Payment window expired. Please book again.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const result = await paymentService.uploadProof(booking._id, file);
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload proof');
      }
      setSubmittedBooking(result.booking);
      setWhatsappUrl(result.whatsappUrl);
      if (result.bankDetails) setBankDetails(result.bankDetails);
    } catch (err) {
      setError(err.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  if (submittedBooking) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wide mb-1">
            Awaiting verification
          </p>
          <p className="text-sm text-emerald-900 leading-relaxed">
            Your screenshot was received. An admin will confirm your booking soon.
            Meeting link will appear after confirmation.
          </p>
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-[#25D366] text-white font-semibold hover:opacity-95 transition"
          >
            Send on WhatsApp
          </a>
        )}

        <p className="text-xs text-gray-500 text-center leading-relaxed">
          WhatsApp opens with your booking details and screenshot link so support can verify quickly.
          You can also attach the screenshot from your gallery.
        </p>

        <Button variant="secondary" className="w-full" onClick={() => onComplete?.(submittedBooking)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-semibold text-gray-900">Transfer amount</p>
          <p className="text-lg font-bold text-gray-900 tabular-nums">
            {amount} {currency}
          </p>
        </div>
        {countdown && (
          <p className={`text-sm ${expired ? 'text-red-600' : 'text-amber-700'}`}>
            {expired
              ? 'Proof window expired'
              : `Upload screenshot within ${countdown}`}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-900 mb-2">Mentorick bank details</p>
        {bankDetails ? (
          <>
            {bankDetails.accountTitle && (
              <p className="text-sm text-gray-700"><span className="text-gray-500">Title:</span> {bankDetails.accountTitle}</p>
            )}
            {bankDetails.bankName && (
              <p className="text-sm text-gray-700"><span className="text-gray-500">Bank:</span> {bankDetails.bankName}</p>
            )}
            {bankDetails.accountNumber && (
              <p className="text-sm text-gray-700"><span className="text-gray-500">Account:</span> {bankDetails.accountNumber}</p>
            )}
            {bankDetails.iban && (
              <p className="text-sm text-gray-700"><span className="text-gray-500">IBAN:</span> {bankDetails.iban}</p>
            )}
            {bankDetails.branch && (
              <p className="text-sm text-gray-700"><span className="text-gray-500">Branch:</span> {bankDetails.branch}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Loading bank details…</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment screenshot
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700"
          disabled={expired || uploading}
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || expired || !file}
        className="w-full"
      >
        {uploading ? 'Uploading…' : 'Submit payment screenshot'}
      </Button>

      {onCancel && (
        <Button variant="secondary" className="w-full" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
      )}
    </div>
  );
};

export default BankTransferPaymentPanel;
