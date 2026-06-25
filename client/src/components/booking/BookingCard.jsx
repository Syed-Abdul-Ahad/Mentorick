import { useState } from 'react';
import { HiOutlineVideoCamera } from 'react-icons/hi2';
import Button from '../shared/Button';

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

const ParticipantAvatar = ({ src, firstName, lastName, label, sublabel, variant = 'mentor' }) => {
  const [imgError, setImgError] = useState(false);
  const imageUrl = resolveImageUrl(src);
  const showImage = imageUrl && !imgError;
  const initials = getInitials(firstName, lastName);
  const isMentor = variant === 'mentor';

  return (
    <div className="flex flex-col items-center text-center min-w-0 flex-1">
      <div
        className={`
          relative w-14 h-14 rounded-full ring-2 ring-white shadow-md overflow-hidden flex-shrink-0
          ${isMentor
            ? 'bg-gradient-to-br from-primary-400 to-primary-600'
            : 'bg-gradient-to-br from-slate-400 to-slate-600'}
        `}
      >
        {showImage && (
          <img
            src={imageUrl}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {!showImage && (
          <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm tracking-wide">
            {initials}
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 truncate w-full px-1" title={sublabel}>
        {sublabel}
      </p>
    </div>
  );
};

const STATUS_META = {
  pending: { dot: 'bg-amber-500', text: 'text-amber-700' },
  confirmed: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  completed: { dot: 'bg-blue-500', text: 'text-blue-700' },
  cancelled: { dot: 'bg-red-500', text: 'text-red-600' },
  'no-show': { dot: 'bg-gray-400', text: 'text-gray-600' },
};

const BookingCard = ({ booking, timeInfo, utcTimeInfo, userTimezone }) => {
  const isMega = booking.isMegaSession || booking.parentMegaSession;
  const mentorName = booking.mentor
    ? `${booking.mentor.firstName} ${booking.mentor.lastName}`
    : 'Mentor';
  const menteeName = booking.mentee
    ? `${booking.mentee.firstName} ${booking.mentee.lastName}`
    : 'Mentee';

  const mentorHeadshot = booking.mentorHeadshot || booking.mentorProfile?.headshot;
  const menteeHeadshot = booking.menteeHeadshot || booking.menteeProfile?.headshot;
  const megaImage = booking.megaSessionImage || '/mega-session.jpg';

  const roleLabel = booking.userRole === 'mentor' ? 'As mentor' : 'As mentee';
  const statusMeta = STATUS_META[booking.status] || STATUS_META['no-show'];
  const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

  return (
    <article
      className={`
        group relative flex flex-col h-full rounded-2xl border bg-white overflow-hidden
        transition-shadow duration-200 hover:shadow-lg
        ${isMega ? 'border-violet-100' : 'border-gray-200/80'}
      `}
    >
      <div className="flex flex-col flex-1 p-5">
        {/* Header — flat metadata, no pills */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dot}`} />
              <span className={`text-sm font-medium ${statusMeta.text}`}>{statusLabel}</span>
            </div>
            <p className="text-xs text-gray-400">
              {roleLabel}
              {isMega && (
                <>
                  <span className="mx-1.5 text-gray-300">·</span>
                  <span className={booking.isMegaSession ? 'text-violet-600' : 'text-violet-500'}>
                    Mega session
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">
              {booking.price.amount}
              <span className="text-sm font-semibold text-gray-400 ml-1">{booking.price.currency}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{booking.durationMinutes} minutes</p>
          </div>
        </div>

        {/* Participants — unchanged */}
        {booking.isMegaSession ? (
          <div className="mb-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-50/80 to-indigo-50/50 border border-violet-100/80">
              <ParticipantAvatar
                src={mentorHeadshot}
                firstName={booking.mentor?.firstName}
                lastName={booking.mentor?.lastName}
                label="Mentor"
                sublabel={mentorName}
                variant="mentor"
              />
              <div className="flex flex-col items-center flex-shrink-0 px-1">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-semibold text-violet-600 tabular-nums">
                  {booking.participants?.length || 0}/{booking.maxParticipants}
                </div>
              </div>
              <ParticipantAvatar
                src={megaImage}
                firstName=""
                lastName=""
                label="Group"
                sublabel={booking.title || 'Mega Session'}
                variant="mentee"
              />
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
              <ParticipantAvatar
                src={mentorHeadshot}
                firstName={booking.mentor?.firstName}
                lastName={booking.mentor?.lastName}
                label="Mentor"
                sublabel={mentorName}
                variant="mentor"
              />
              <div className="flex-1 flex items-center justify-center px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent max-w-[60px]" />
                <span className="mx-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest">with</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent max-w-[60px]" />
              </div>
              <ParticipantAvatar
                src={menteeHeadshot}
                firstName={booking.mentee?.firstName}
                lastName={booking.mentee?.lastName}
                label="Mentee"
                sublabel={menteeName}
                variant="mentee"
              />
            </div>
            {booking.parentMegaSession && booking.title && (
              <p className="mt-2 text-xs text-violet-600 font-medium text-center">
                Part of: {booking.title}
              </p>
            )}
          </div>
        )}

        {/* Schedule + footer — clearer hierarchy */}
        <div className="mt-auto border-t border-gray-100 pt-4">
          <p className="text-base font-semibold text-gray-900 leading-snug">
            {timeInfo.day}, {timeInfo.date}
          </p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Your time</p>
              <p className="text-sm font-medium text-gray-800">
                {timeInfo.time}
                <span className="block text-xs font-normal text-gray-400 mt-0.5">{userTimezone}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">UTC</p>
              <p className="text-sm font-medium text-gray-800">
                {utcTimeInfo.time}
                <span className="block text-xs font-normal text-gray-400 mt-0.5">{utcTimeInfo.date}</span>
              </p>
            </div>
          </div>

          {booking.description && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 mb-1">Agenda</p>
              <p className="text-sm text-gray-600 leading-relaxed">{booking.description}</p>
            </div>
          )}

          {booking.meeting?.meetingLink && (
            <div className="mt-4">
              <Button
                variant="solid"
                size="sm"
                onClick={() => window.open(booking.meeting.meetingLink, '_blank')}
                className={`w-full flex items-center justify-center gap-2 ${
                  isMega ? 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800' : ''
                }`}
              >
                <HiOutlineVideoCamera className="w-4 h-4" />
                Join meeting
              </Button>
            </div>
          )}

          {booking.status === 'pending' && booking.userRole === 'mentee' && (
            <p className="mt-3 text-xs text-amber-700/90 leading-relaxed">
              Waiting for confirmation — a meeting link will appear here once the session is confirmed.
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default BookingCard;
