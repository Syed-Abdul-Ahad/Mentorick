import { useState } from 'react';
import {
  HiOutlineVideoCamera,
  HiOutlineCalendar,
  HiOutlineClock,
} from 'react-icons/hi2';
import { formatDurationLabel } from '../../utils/durationDisplay';

const resolveImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('/mega-session')) return src;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  return `${base}${src.startsWith('/') ? src : `/${src}`}`;
};

const getInitials = (firstName = '', lastName = '') => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
};

const getOrdinal = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatCardDate = (utcDate, timezone) => {
  const date = new Date(utcDate);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
  const dayNum = parseInt(
    date.toLocaleDateString('en-US', { day: 'numeric', timeZone: timezone }),
    10
  );
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: timezone });
  const year = date.toLocaleDateString('en-US', { year: 'numeric', timeZone: timezone });
  return `${weekday}, ${dayNum}${getOrdinal(dayNum)} ${month}, ${year}`;
};

const formatTimezoneLabel = (timezone) => {
  if (!timezone) return 'UTC';
  return timezone.split('/').map((part) => part.replace(/_/g, ' ')).join(' / ');
};

const formatPrice = (amount, currency) => {
  if (currency === 'USD') return `$ ${amount}`;
  return `${currency} ${amount}`;
};

const formatUtcTooltip = (utcDate) => {
  const date = new Date(utcDate);
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: true,
  });
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${time} UTC · ${dateStr}`;
};

const UtcInfoTooltip = ({ text }) => (
  <span className="group/utc relative inline-flex">
    <button
      type="button"
      className="flex h-[18px] w-[18px] cursor-help items-center justify-center rounded-full bg-[#E0E0E0] text-[9px] font-bold leading-none text-[#888888] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      aria-label={`UTC: ${text}`}
    >
      i
    </button>
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 whitespace-nowrap rounded-md bg-[#333333] px-2.5 py-1.5 text-[10px] font-medium leading-none text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/utc:opacity-100 group-focus-within/utc:opacity-100"
    >
      {text}
    </span>
  </span>
);

const STATUS_BADGE = {
  pending: 'bg-[#F59E0B]',
  confirmed: 'bg-[#28B463]',
  completed: 'bg-[#3B82F6]',
  cancelled: 'bg-[#EF4444]',
  'no-show': 'bg-[#9CA3AF]',
};

const ParticipantAvatar = ({ src, firstName, lastName, isMegaSession = false }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = resolveImageUrl(src);
  const showImage = imageUrl && !imgError;
  const initials = getInitials(firstName, lastName);

  const sizeClass =
    '2xl:h-[92px] 2xl:w-[92px] xl:h-[80px] xl:w-[80px] h-[72px] w-[72px] flex-shrink-0';

  const avatarInner = (
    <>
      {showImage && (
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      {!showImage && (
        <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-white">
          {initials}
        </div>
      )}
    </>
  );

  if (isMegaSession) {
    return (
      <div
        className={`relative rounded-full bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-500 p-[2.5px] ${sizeClass}`}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full bg-gray-200">
          {avatarInner}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-full border-[2.5px] border-[#28B463] bg-gray-200 ${sizeClass}`}
    >
      {avatarInner}
    </div>
  );
};

const BookingCard = ({ booking, timeInfo, utcTimeInfo, userTimezone }) => {
  const mentorName = booking.mentor
    ? `${booking.mentor.firstName} ${booking.mentor.lastName}`
    : 'Mentor';
  const menteeName = booking.mentee
    ? `${booking.mentee.firstName} ${booking.mentee.lastName}`
    : 'Mentee';

  const mentorHeadshot = booking.mentorHeadshot || booking.mentorProfile?.headshot;
  const menteeHeadshot = booking.menteeHeadshot || booking.menteeProfile?.headshot;

  const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  const statusBadgeClass = STATUS_BADGE[booking.status] || STATUS_BADGE['no-show'];

  const isMentorView = booking.userRole === 'mentor';
  const displayPerson = booking.isMegaSession
    ? {
        headshot: mentorHeadshot,
        firstName: booking.mentor?.firstName,
        lastName: booking.mentor?.lastName,
        name: mentorName,
        roleLabel: 'As Mentor',
      }
    : isMentorView
    ? {
        headshot: menteeHeadshot,
        firstName: booking.mentee?.firstName,
        lastName: booking.mentee?.lastName,
        name: menteeName,
        roleLabel: 'As Mentee',
      }
    : {
        headshot: mentorHeadshot,
        firstName: booking.mentor?.firstName,
        lastName: booking.mentor?.lastName,
        name: mentorName,
        roleLabel: 'As Mentor',
      };

  const cardDate = formatCardDate(booking.startTimeUTC, userTimezone);
  const timezoneLabel = formatTimezoneLabel(userTimezone);
  const utcTooltip = formatUtcTooltip(booking.startTimeUTC);
  const agendaText = booking.description?.trim() || 'No agenda provided';
  const isMega = booking.isMegaSession || booking.parentMegaSession;

  return (
    <article className="relative flex aspect-square w-full flex-col rounded-[20px] border border-[#E0E0E0] bg-white">
      {/* Corner status badge */}
      <span
        className={`absolute right-0 top-0 z-10 rounded-bl-[14px] px-3.5 py-[6px] text-[11px] font-semibold text-white ${statusBadgeClass}`}
      >
        {statusLabel}
      </span>

      {/* Top — profile | pricing */}
      <div className="relative flex min-h-0 flex-[1.5]">
        {/* Inset vertical divider — gap from top, stops before horizontal rule */}
        <div
          className="pointer-events-none absolute left-1/2 top-[25px] bottom-[30px] w-px -translate-x-1/2 bg-[#E0E0E0]"
          aria-hidden="true"
        />

        {/* Left — profile */}
        <div className="flex w-1/2 flex-col items-center justify-center px-3 pb-3 pt-5">
          <ParticipantAvatar
            src={displayPerson.headshot}
            firstName={displayPerson.firstName}
            lastName={displayPerson.lastName}
            isMegaSession={isMega}
          />
          <p className="mt-2.5 max-w-full truncate px-1 text-center text-[17px] font-bold leading-tight text-[#1A1A1A]">
            {displayPerson.name}
          </p>
          <p className="mt-0.5 text-center text-[12px] text-[#AAAAAA]">{displayPerson.roleLabel}</p>
          {booking.isMegaSession && (
            <p className="mt-1 max-w-full truncate px-1 text-center text-[10px] font-medium text-violet-600">
              Mega · {booking.participants?.length || 0}/{booking.maxParticipants}
            </p>
          )}
          {booking.parentMegaSession && booking.title && (
            <p className="mt-0.5 max-w-full truncate px-1 text-center text-[10px] font-medium text-violet-600">
              {booking.title}
            </p>
          )}
        </div>

        {/* Right — price & join */}
        <div className="flex w-1/2 flex-col items-center justify-center px-3 pb-3 pt-8">
          <p className="text-[26px] font-bold leading-none text-[#1A1A1A] tabular-nums">
            {formatPrice(booking.price.amount, booking.price.currency)}
          </p>
          {isMentorView && booking.payment?.mentorPayoutAmount != null && (
            <p className="mt-1 text-[11px] text-emerald-700 tabular-nums">
              You get {formatPrice(booking.payment.mentorPayoutAmount, booking.payment.currency || booking.price.currency)}
              {booking.payment?.platformFee != null && (
                <span className="text-[#AAAAAA]">
                  {' '}
                  (fee {formatPrice(booking.payment.platformFee, booking.payment.currency || booking.price.currency)})
                </span>
              )}
            </p>
          )}
          {!isMentorView && booking.payment?.status && booking.payment.status !== 'paid' && booking.status === 'pending' && (
            <p className="mt-1 text-[11px] text-amber-700 tabular-nums">
              Due {formatPrice(booking.payment.amount ?? booking.price.amount, booking.payment.currency || booking.price.currency)}
            </p>
          )}
          <p className="mt-2 flex items-center gap-1 text-[12px] text-[#AAAAAA]">
            <HiOutlineClock className="h-[14px] w-[14px] shrink-0" strokeWidth={1.8} />
            <span>{formatDurationLabel(booking.durationMinutes)}</span>
          </p>

          {booking.status === 'confirmed' && booking.meeting?.meetingLink ? (
            <button
              type="button"
              onClick={() => window.open(booking.meeting.meetingLink, '_blank')}
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-[6px] text-[12px] font-semibold text-white transition-colors ${
                isMega
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                  : 'bg-[#28B463] hover:bg-[#239954]'
              }`}
            >
              <span className="xl:text-[16px] text-[12px] font-semibold">Join</span>
              <HiOutlineVideoCamera className="xl:h-[18px] xl:w-[18px] h-[14px] w-[14px]" strokeWidth={2} />
            </button>
          ) : (
            <div className="mt-3 h-[30px]" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Inset horizontal divider — gap at centre so it never meets the vertical line */}
      <div className="mx-5 flex shrink-0 items-center gap-5" aria-hidden="true">
        <div className="h-px flex-1 bg-[#E0E0E0]" />
        {/* <div className="h-px flex-1 bg-[#E0E0E0]" /> */}
      </div>

      {/* Bottom — schedule & agenda */}
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <HiOutlineCalendar className="h-[16px] w-[16px] shrink-0 text-[#333333]" strokeWidth={2} />
            <p className="truncate text-[15px] font-bold leading-tight text-[#1A1A1A]">{cardDate}</p>
          </div>

          <div className="relative shrink-0 text-right">
            <div className="flex items-center justify-end gap-1">
              <HiOutlineClock className="h-[16px] w-[16px] shrink-0 text-[#333333]" strokeWidth={2} />
              <p className="text-[15px] font-bold text-[#1A1A1A]">{timeInfo.time}</p>
              <UtcInfoTooltip text={utcTooltip} />
            </div>
            <p className="mt-0.5 text-[12px] text-[#AAAAAA]">{timezoneLabel}</p>
          </div>
        </div>

        <div
          title={agendaText}
          className="mt-2.5 h-[60px] shrink-0 overflow-hidden rounded-[14px] bg-[#F0F0F0] px-3 py-2 mt-10 mb-5"
        >
          <p className="line-clamp-2 text-[11px] leading-[1.45] text-[#888888]">{agendaText}</p>
        </div>

        {booking.status === 'pending' && (
          <p
            className="mt-1 truncate text-[10px] text-amber-600"
            title="Waiting for confirmation — meeting link appears after admin verifies payment."
          >
            {booking.payment?.status === 'awaiting_proof' && 'Awaiting payment screenshot'}
            {booking.payment?.status === 'awaiting_verification' && 'Payment under review'}
            {booking.payment?.status === 'rejected' && 'Proof rejected — please book again'}
            {!booking.payment?.status && 'Waiting for confirmation'}
          </p>
        )}
      </div>
    </article>
  );
};

export default BookingCard;
