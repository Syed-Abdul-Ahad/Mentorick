import { useState } from 'react';
import {
  HiOutlineVideoCamera,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { PiHourglassHigh } from "react-icons/pi";
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

/* ─── Status SVG Icons ─────────────────────────────────────────── */

const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PendingIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CancelledIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const NoShowIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ─── Status Corner Ribbon ────────────────────────────────────── */

const StatusRibbon = ({ status }) => {
  const statusColors = {
    pending: '#F59E0B',
    confirmed: '#28B463',
    completed: '#28B463',
    cancelled: '#EF4444',
    'no-show': '#9CA3AF',
  };

  const color = statusColors[status] || '#9CA3AF';

  const getIcon = () => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckIcon className="w-3 h-3 text-white mr-0.5 mt-0.5" />;
      case 'pending':
        return <PendingIcon className="w-3.5 h-3.5 text-white" />;
      case 'cancelled':
        return <CancelledIcon className="w-3 h-3 text-white" />;
      default:
        return <NoShowIcon className="w-3.5 h-3.5 text-white" />;
    }
  };

  return (
    <div
      className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div
        className="absolute top-0 right-0 w-0 h-0"
        style={{
          borderTop: `48px solid ${color}`,
          borderLeft: '48px solid transparent',
        }}
      />
      <div className="absolute top-[6px] right-[6px] flex items-center justify-center">
        {getIcon()}
      </div>
    </div>
  );
};

/* ─── UTC tooltip ───────────────────────────────────────────────── */

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

/* ─── Main avatar ───────────────────────────────────────────────── */

const MainAvatar = ({ src, firstName, lastName }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = resolveImageUrl(src);
  const showImage = imageUrl && !imgError;
  const initials = getInitials(firstName, lastName);

  return (
    <div className="relative flex-shrink-0 h-12 w-12 overflow-hidden rounded-full">
      {showImage ? (
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white bg-[#28B463]"
        >
          {initials}
        </div>
      )}
    </div>
  );
};

/* ─── BookingCard ───────────────────────────────────────────────── */

const BookingCard = ({ booking, timeInfo, utcTimeInfo, userTimezone }) => {
  const mentorName = booking.mentor
    ? `${booking.mentor.firstName} ${booking.mentor.lastName}`
    : 'Mentor';
  const menteeName = booking.mentee
    ? `${booking.mentee.firstName} ${booking.mentee.lastName}`
    : 'Mentee';

  const mentorHeadshot = booking.mentorHeadshot || booking.mentorProfile?.headshot;
  const menteeHeadshot = booking.menteeHeadshot || booking.menteeProfile?.headshot;

  const isMentorView = booking.userRole === 'mentor';
  const isMega = booking.isMegaSession || booking.parentMegaSession;

  const displayPerson = isMega
    ? {
      headshot: mentorHeadshot,
      firstName: booking.mentor?.firstName,
      lastName: booking.mentor?.lastName,
      name: mentorName,
      roleLabel: 'Mentor',
    }
    : isMentorView
      ? {
        headshot: menteeHeadshot,
        firstName: booking.mentee?.firstName,
        lastName: booking.mentee?.lastName,
        name: menteeName,
        roleLabel: 'Mentee',
      }
      : {
        headshot: mentorHeadshot,
        firstName: booking.mentor?.firstName,
        lastName: booking.mentor?.lastName,
        name: mentorName,
        roleLabel: 'Mentor',
      };

  const cardDate = formatCardDate(booking.startTimeUTC, userTimezone);
  const timezoneLabel = formatTimezoneLabel(userTimezone);
  const utcTooltip = formatUtcTooltip(booking.startTimeUTC);
  const agendaText = booking.description?.trim() || 'No agenda provided';

  return (
    <article
      className="relative w-full rounded-[16px] border border-gray-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row justify-between gap-6 transition-all duration-200 hover:shadow-md overflow-hidden"
    >
      {/* Corner Status Ribbon */}
      <StatusRibbon status={booking.status} />

      {/* Left side: Avatar + Info */}
      <div className="flex-1 flex flex-col gap-3.5 min-w-0">
        {/* Top row: Avatar & Name block */}
        <div className="flex items-center gap-4">
          <MainAvatar
            src={displayPerson.headshot}
            firstName={displayPerson.firstName}
            lastName={displayPerson.lastName}
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-900 leading-tight">
                {displayPerson.name}
              </span>
              <span className={`text-sm font-semibold ${isMega ? 'text-[#28B463]' : 'text-gray-500'}`}>
                {isMega ? `Mega Session ( ${booking.participants?.length || 0}/${booking.maxParticipants} )` : '1-On-1 Session'}
              </span>
            </div>
            <span className="text-sm text-gray-500 font-medium mt-0.5">
              {displayPerson.roleLabel}
            </span>
          </div>
        </div>

        {/* Middle row: Schedule details */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 font-medium select-none">
          <span className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-2 py-1">
            <HiOutlineCalendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span>{cardDate}</span>
          </span>

          <span className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-2 py-1">
            <HiOutlineClock className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span>{timeInfo.time}</span>
            <span className="inline-flex items-center  ">
              <UtcInfoTooltip text={utcTooltip} />
            </span>
          </span>

          <span className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-2 py-1">
            <PiHourglassHigh className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span>{formatDurationLabel(booking.durationMinutes)}</span>
          </span>

          <span className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-2 py-1">
            <HiOutlineMapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span>{timezoneLabel}</span>
          </span>
        </div>

        {/* Bottom row: Description / Agenda */}
        <p className="text-sm text-gray-800 leading-relaxed font-normal">
          {isMega && booking.title ? (
            <>
              <span className="font-bold text-black">{booking.title}:</span>{' '}
            </>
          ) : null}
          {agendaText}
        </p>

        {booking.status === 'pending' && booking.userRole === 'mentee' && !booking.meeting?.meetingLink && (
          <p className="text-xs text-amber-600 font-semibold mt-1">Awaiting confirmation</p>
        )}
      </div>

      {/* Right side: Price + Action */}
      <div className="flex flex-row sm:flex-col sm:justify-between items-end sm:text-right shrink-0 min-w-[120px] self-stretch gap-4 sm:gap-0 select-none">
        {/* Price */}
        <div className="pr-6">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(booking.price.amount, booking.price.currency)}
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          {booking.meeting?.meetingLink ? (
            <button
              type="button"
              onClick={() => window.open(booking.meeting.meetingLink, '_blank')}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold bg-[#28B463] hover:bg-[#239954] text-white shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
            >
              <HiOutlineVideoCamera className="h-[15px] w-[15px]" strokeWidth={2.5} />
              Join Meeting
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default BookingCard;