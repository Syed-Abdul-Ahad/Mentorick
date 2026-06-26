import { HiOutlineSparkles } from 'react-icons/hi2';
import Card from '../shared/Card';

export const formatMegaSessionTime = (utcTime, userTimezone) => {
  const utcDate = new Date(utcTime);

  const userLocal = utcDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimezone,
  });

  const userDate = utcDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: userTimezone,
  });

  const utcTimeFormatted = utcDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  return {
    userLocal,
    userDate,
    utc: `${utcTimeFormatted} UTC +00`,
  };
};

const MegaSessionCard = ({ session, mentorProfile, children }) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeInfo = formatMegaSessionTime(session.startTimeUTC, userTimezone);
  const participantCount = session.participants?.length || 0;
  const profile = mentorProfile || session.mentorProfile || {};

  return (
    <Card
      className="!p-0 flex flex-col h-full rounded-2xl overflow-hidden border-gray-200/80"
    >
      <div className="flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/95">
          Mega Session
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-100">
          <HiOutlineSparkles className="w-3.5 h-3.5" />
          Exclusive
        </span>
      </div>

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-shrink-0 rounded-full bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-500 p-[2.5px]">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-white ring-2 ring-white">
              {profile.headshot ? (
                <img
                  src={profile.headshot}
                  alt={profile.fullName || 'Mentor'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-500 text-xl font-bold text-white">
                  {(profile.fullName || 'M').charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight truncate">
              {profile.fullName}
            </p>
            {profile.title && (
              <p className="text-sm text-gray-500 truncate mt-0.5">{profile.title}</p>
            )}
          </div>
          <div className="text-right shrink-0 pl-2">
            <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
              {session.price.amount}
            </p>
            <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">
              {session.price.currency}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-900 leading-snug">
            {timeInfo.userLocal}
            <span className="text-gray-400 font-normal"> · </span>
            <span className="font-medium text-gray-700">{timeInfo.userDate}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">{timeInfo.utc}</p>
        </div>

        <div className="mb-6 pb-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 leading-snug">{session.title}</h3>
          {session.description && (
            <p className="text-sm text-gray-400 line-clamp-1 mt-1">{session.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2.5">
            {participantCount}/{session.maxParticipants} seats
            <span className="mx-1.5 text-gray-300">·</span>
            {session.durationMinutes} min
          </p>
        </div>

        {children && <div className="mt-auto space-y-3">{children}</div>}
      </div>
    </Card>
  );
};

export default MegaSessionCard;
