import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlineWallet,
  HiOutlineArrowUpTray,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import Seo from '../components/seo/Seo';
import { paymentService } from '../api';
import { formatDurationLabel } from '../utils/durationDisplay';

const formatCountdown = (dueAt) => {
  if (!dueAt) return null;
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const formatSessionDate = (startTimeUTC, timezone) => {
  if (!startTimeUTC) return null;
  try {
    return new Date(startTimeUTC).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone || undefined,
    });
  } catch {
    return null;
  }
};

const formatSessionTime = (startTimeUTC, timezone) => {
  if (!startTimeUTC) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    }).format(new Date(startTimeUTC));
  } catch {
    return null;
  }
};

const resolveImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  return `${base}${src.startsWith('/') ? src : `/${src}`}`;
};

const Avatar = ({ src, name, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'h-16 w-16 text-lg' : 'h-9 w-9 text-xs';
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-500 text-white font-semibold flex items-center justify-center ring-2 ring-white shadow-sm`}
    >
      {initials}
    </div>
  );
};

/**
 * Full-page bank transfer + screenshot upload after booking confirm.
 * Route: /booking/payment/:bookingId
 */
const BookingPaymentPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [bankDetails, setBankDetails] = useState(location.state?.bankDetails || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!bookingId) {
        setError('Missing booking id');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const res = await paymentService.getBookingPayment(bookingId);
        if (cancelled) return;
        if (!res?.success || !res.booking) {
          throw new Error(res?.error || res?.message || 'Failed to load payment');
        }
        setBooking(res.booking);
        setBankDetails(res.bankDetails || null);
        if (res.booking?.payment?.status === 'awaiting_verification') {
          setSubmitted(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load payment page');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const timezone = booking?.menteeTimezone || booking?.mentorTimezone;
  const sessionDate = useMemo(
    () => formatSessionDate(booking?.startTimeUTC, timezone),
    [booking?.startTimeUTC, timezone]
  );
  const sessionTime = useMemo(
    () => formatSessionTime(booking?.startTimeUTC, timezone),
    [booking?.startTimeUTC, timezone]
  );

  const mentorProfile = booking?.mentorProfile;
  const mentorName =
    mentorProfile?.fullName ||
    (booking?.mentor
      ? `${booking.mentor.firstName || ''} ${booking.mentor.lastName || ''}`.trim()
      : null);
  const mentorHeadshot = resolveImageUrl(mentorProfile?.headshot);
  const mentorTitle = mentorProfile?.title || 'Mentor';

  const proofDueAt = booking?.payment?.proofDueAt;
  const countdown = useMemo(() => formatCountdown(proofDueAt), [proofDueAt, nowTick]);
  const expired =
    proofDueAt && new Date(proofDueAt).getTime() <= Date.now() && !submitted;

  const amount = booking?.payment?.amount ?? booking?.price?.amount;
  const currency = booking?.payment?.currency || booking?.price?.currency || 'USD';

  const paymentStatus = booking?.payment?.status;
  const isAwaitingVerification =
    submitted || paymentStatus === 'awaiting_verification';
  const isExpiredOrCancelled =
    booking?.status === 'cancelled' ||
    paymentStatus === 'expired' ||
    paymentStatus === 'rejected';

  const handleUpload = async () => {
    if (!booking?._id) return;
    if (!file) {
      setUploadError('Please select a payment screenshot');
      return;
    }
    if (expired) {
      setUploadError('Payment window expired. Please book again.');
      return;
    }
    // Soft warn — large files are more likely to hit network/Cloudinary delays
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Screenshot is over 3 MB. Please use a smaller image and try again.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      const result = await paymentService.uploadProof(booking._id, file);
      if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Failed to upload proof');
      }
      setBooking(result.booking || booking);
      setWhatsappUrl(result.whatsappUrl || null);
      if (result.bankDetails) setBankDetails(result.bankDetails);
      setSubmitted(true);
    } catch (err) {
      setUploadError(err.message || err?.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7fbf8]">
      <Seo
        title="Complete Payment | Mentorick"
        description="Transfer payment and upload your screenshot to reserve your Mentorick session."
        canonical={`/booking/payment/${bookingId || ''}`}
        noindex
      />

      {/* Soft green corner washes — mockup atmosphere */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 top-40 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-80 rounded-full bg-primary-100/50 blur-3xl"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 pb-12 pt-8 sm:pt-10">
        {loading ? (
          <div className="rounded-3xl bg-white/80 p-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
            <p className="mt-4 text-sm text-gray-500">Loading payment details…</p>
          </div>
        ) : error && !booking ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="mb-4 text-sm text-red-700">{error}</p>
            <Link to="/my-bookings" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Back to My Bookings
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Hero status */}
            <section className="text-center pt-2 pb-1">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30">
                <HiOutlineCheck className="h-9 w-9" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-gray-900">
                {isAwaitingVerification
                  ? 'Payment under review'
                  : isExpiredOrCancelled
                    ? 'Booking not active'
                    : 'Slot reserved'}
              </h1>
              <p className="mt-2 text-sm sm:text-[15px] text-gray-500 leading-relaxed max-w-md mx-auto">
                {isAwaitingVerification
                  ? 'Thank you! An admin will confirm your booking soon.'
                  : isExpiredOrCancelled
                    ? 'This payment window is no longer available. Please book a new slot.'
                    : 'Your slot is held while you transfer and upload a payment screenshot.'}
              </p>

              {!isAwaitingVerification && !isExpiredOrCancelled && countdown && (
                <div className="mt-6 inline-flex items-center gap-4 rounded-full bg-primary-100 px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg text-primary-900 shadow-sm">
                  <span className="inline-flex items-center gap-2 font-bold tabular-nums tracking-wide">
                    <HiOutlineClock className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                    {countdown}
                  </span>
                  <span className="h-5 sm:h-6 w-px bg-primary-300/90" aria-hidden="true" />
                  <span className="font-semibold text-primary-800">
                    {expired ? 'Window expired' : 'Awaiting screenshot'}
                  </span>
                </div>
              )}
            </section>

            {/* Mentor card */}
            {booking && (
              <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-gray-100/80">
                <div className="mb-4 flex items-center gap-2 text-primary-600">
                  <HiOutlineUser className="h-4 w-4" />
                  <span className="text-sm font-semibold">Mentor</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="flex items-center gap-3 min-w-0 sm:w-[42%]">
                    <Avatar src={mentorHeadshot} name={mentorName} size="lg" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{mentorName || 'Mentor'}</p>
                      <p className="text-sm text-gray-500 truncate">{mentorTitle}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5 text-sm">
                    {booking.durationMinutes != null && (
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <HiOutlineClock className="h-4 w-4 text-primary-500 shrink-0" />
                        <span>{formatDurationLabel(booking.durationMinutes)}</span>
                      </div>
                    )}
                    {sessionDate && (
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <HiOutlineCalendarDays className="h-4 w-4 text-primary-500 shrink-0" />
                        <span>{sessionDate}</span>
                      </div>
                    )}
                    {sessionTime && (
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <HiOutlineClock className="h-4 w-4 text-primary-500 shrink-0" />
                        <span>
                          {sessionTime}
                          {timezone ? ` · ${timezone}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Success state after upload */}
            {isAwaitingVerification && !isExpiredOrCancelled && (
              <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-emerald-100 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <HiOutlineCheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-[15px] text-emerald-950 leading-relaxed">
                      Thank you! Your booking was received and an admin will confirm your booking soon.
                      Meeting link will appear in your Mentorick dashboard right after confirmation and
                      will also be emailed to you.
                    </p>
                  </div>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3 font-semibold text-white hover:opacity-95 transition"
                  >
                    Send on WhatsApp
                  </a>
                )}

                <p className="text-xs text-center text-gray-500 leading-relaxed">
                  WhatsApp opens with your booking details and screenshot link so support can verify
                  quickly. You can also attach the screenshot from your gallery.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/my-bookings')}
                  className="w-full rounded-xl border border-primary-500 bg-white px-4 py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition"
                >
                  Done
                </button>
              </section>
            )}

            {/* Transfer + upload */}
            {!isAwaitingVerification && !isExpiredOrCancelled && booking && (
              <>
                <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-gray-100/80">
                  <div className="mb-3 flex items-center gap-2 text-primary-600">
                    <HiOutlineWallet className="h-4 w-4" />
                    <span className="text-sm font-semibold">Transfer amount</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-primary-700 tabular-nums">
                    {amount} {currency}
                  </p>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <p className="mb-3 text-sm font-semibold text-gray-900">Mentorick bank details</p>
                    {bankDetails ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {bankDetails.accountTitle && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Title</p>
                            <p className="font-medium text-gray-900">{bankDetails.accountTitle}</p>
                          </div>
                        )}
                        {bankDetails.bankName && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Bank</p>
                            <p className="font-medium text-gray-900">{bankDetails.bankName}</p>
                          </div>
                        )}
                        {bankDetails.accountNumber && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Account</p>
                            <p className="font-medium text-gray-900 tabular-nums">{bankDetails.accountNumber}</p>
                          </div>
                        )}
                        {bankDetails.iban && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-400 mb-0.5">IBAN</p>
                            <p className="font-medium text-gray-900 break-all">{bankDetails.iban}</p>
                          </div>
                        )}
                        {bankDetails.branch && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Branch</p>
                            <p className="font-medium text-gray-900">{bankDetails.branch}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Loading bank details…</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-gray-100/80 space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={expired || uploading}
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setUploadError('');
                    }}
                  />

                  <button
                    type="button"
                    disabled={expired || uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/40 px-4 py-8 text-center transition hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <HiOutlineArrowUpTray className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Payment Screenshot</span>
                    <span className="text-xs text-gray-500 max-w-xs">
                      {file
                        ? file.name
                        : 'Upload a clear screenshot of your payment'}
                    </span>
                  </button>

                  {uploadError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || expired || !file}
                    className="w-full rounded-xl border-2 border-primary-500 bg-white px-4 py-3 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {uploading ? 'Uploading…' : 'Submit payment screenshot'}
                  </button>
                </section>

                {countdown && (
                  <p className="flex items-start gap-2 px-1 text-sm text-gray-600 leading-relaxed">
                    <HiOutlineInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                    <span>
                      {expired ? (
                        <>
                          Payment window expired. Failure to upload in time results in your booking
                          being reverted.
                        </>
                      ) : (
                        <>
                          Please upload payment screenshot within{' '}
                          <span className="font-bold tabular-nums text-gray-900">{countdown}</span>{' '}
                          to reserve the slot. Failure to do so will result in your booking being
                          reverted.
                        </>
                      )}
                    </span>
                  </p>
                )}
              </>
            )}

            {isExpiredOrCancelled && (
              <div className="text-center pt-2">
                <Link
                  to="/mentors"
                  className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                >
                  Book another session
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingPaymentPage;
