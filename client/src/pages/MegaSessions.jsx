import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineVideoCamera,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { megaSessionService } from '../api';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/shared/Button';
import MegaSessionCard from '../components/megaSession/MegaSessionCard';
import Seo from '../components/seo/Seo';
import { isMegaSessionBookableByLeadTime, getMinLeadHours } from '../utils/bookingLeadTime';

/** Same layout language as Bookings banner — violet for mega sessions */
const MegaSessionsBannerArt = () => (
  <svg
    viewBox="0 0 280 160"
    className="h-full w-full max-h-40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <ellipse cx="188" cy="122" rx="80" ry="16" fill="#c4b5fd" opacity="0.32" />
    <path
      d="M40 118c34-18 70-12 104 2 32 12 64 4 96-14"
      stroke="#a78bfa"
      strokeWidth="10"
      strokeLinecap="round"
      opacity="0.28"
    />
    <g transform="translate(98 28) rotate(-6 70 48)">
      <rect x="0" y="0" width="140" height="96" rx="16" fill="#5b21b6" />
      <rect x="10" y="10" width="120" height="76" rx="10" fill="#6d28d9" />
      <rect x="18" y="18" width="104" height="52" rx="8" fill="#8b5cf6" opacity="0.35" />
      <circle cx="46" cy="44" r="12" fill="#ede9fe" />
      <circle cx="70" cy="44" r="12" fill="#ddd6fe" />
      <circle cx="94" cy="44" r="12" fill="#c4b5fd" />
      <rect x="28" y="72" width="84" height="8" rx="4" fill="#ddd6fe" opacity="0.7" />
    </g>
    <g transform="translate(58 58) rotate(12 28 28)">
      <rect x="0" y="0" width="56" height="56" rx="14" fill="#7c3aed" />
      <path
        d="M28 14l2.4 7.4H38l-6.2 4.5 2.4 7.3L28 28.7l-6.2 4.5 2.4-7.3L18 21.4h7.6L28 14z"
        fill="#f5f3ff"
      />
    </g>
  </svg>
);

const MegaSessionsHeroBanner = () => (
  <section className="relative overflow-hidden rounded-2xl border border-violet-200 bg-[#f3e8ff]">
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(90deg,rgb(172, 155, 245) 0%,rgb(139, 79, 203) 50%,rgb(98, 70, 222) 100%), radial-gradient(circle at 20% 30%, rgba(167,139,250,0.22), transparent 45%)',
      }}
    />
    <div className="relative flex items-center gap-4 sm:gap-6 px-5 sm:px-8 py-6 sm:py-7">
      <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7c3aed] text-white shadow-sm shadow-violet-900/20">
        <HiOutlineSparkles className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          Mega Sessions
        </h1>
        <p className="mt-1.5 text-sm sm:text-[15px] text-violet-50 max-w-xl leading-relaxed">
          Join group mentorship sessions with industry experts and connect with fellow learners.
        </p>
      </div>
      <div className="hidden md:block w-52 lg:w-64 shrink-0 self-stretch">
        <MegaSessionsBannerArt />
      </div>
    </div>
  </section>
);

const MegaSessions = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [megaSessions, setMegaSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningSession, setJoiningSession] = useState(null);

  // Fetch mega sessions
  useEffect(() => {
    const fetchMegaSessions = async () => {
      try {
        const response = await megaSessionService.getMegaSessions({ upcoming: true });
        setMegaSessions(response.megaSessions || []);
      } catch (error) {
        toast.error('Failed to fetch mega sessions');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMegaSessions();
  }, []);

  const handleJoinSession = async (session) => {
    if (!user) {
      toast.error('Please log in to join sessions');
      return;
    }

    if (!isMegaSessionBookableByLeadTime(session.startTimeUTC)) {
      toast.error(`Sessions must be booked at least ${getMinLeadHours()} hours in advance`);
      return;
    }

    setJoiningSession(session._id);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await megaSessionService.joinMegaSession(session._id, { timezone });

      if (!response.success) {
        throw new Error(response.error || 'Failed to join this session');
      }

      const booking = response.participantBooking;
      const bookingId = String(booking?._id || booking?.id || '');
      if (!bookingId || bookingId === 'undefined') {
        throw new Error('Booking created but missing id');
      }

      navigate(`/booking/payment/${bookingId}`, {
        replace: false,
        state: {
          booking,
          bankDetails: response.bankDetails || null,
        },
      });
    } catch (error) {
      console.error('Join session error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join session';
      toast.error(errorMessage);
    } finally {
      setJoiningSession(null);
    }
  };


  return (
    <MainLayout>
      <Seo
        title="Mega Sessions | Mentorick"
        description="Browse and join group mega mentorship sessions on Mentorick."
        canonical="/mega-sessions"
        noindex
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <MegaSessionsHeroBanner />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading mega sessions...</p>
          </div>
        ) : megaSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Mega Sessions Available</h3>
            <p className="text-gray-600">Check back later for upcoming group mentorship sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
            {megaSessions.map((session) => {
              // Check if user is joined using both _id and id for compatibility
              const isUserJoined = session.participants?.some(p => 
                p._id === user?._id || p._id === user?.id || p.id === user?._id || p.id === user?.id
              );
              // Check if current user is the mentor hosting this session
              const isUserMentor = session.mentor?._id === user?._id || session.mentor?._id === user?.id || session.mentor?.id === user?._id || session.mentor?.id === user?.id;
              const isFull = session.participants?.length >= session.maxParticipants;

              return (
                <MegaSessionCard key={session._id} session={session}>
                  {isUserMentor ? (
                    <>
                      <p className="text-xs text-gray-500 text-center">
                        You are hosting this session
                      </p>
                      {session.meeting?.meetingLink && (
                        <Button
                          className="w-full flex items-center justify-center gap-2 !bg-gradient-to-r !from-violet-600 !to-indigo-600 hover:!from-violet-700 hover:!to-indigo-700 !border-0"
                          onClick={() => window.open(session.meeting.meetingLink, '_blank')}
                        >
                          <HiOutlineVideoCamera className="w-4 h-4" />
                          <span>Start Meeting</span>
                        </Button>
                      )}
                    </>
                  ) : isUserJoined ? (
                    <>
                      <p className="text-xs text-emerald-600 text-center flex items-center justify-center gap-1">
                        <HiOutlineCheck className="w-3.5 h-3.5" />
                        You're registered for this session
                      </p>
                      {session.meeting?.meetingLink && (
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => window.open(session.meeting.meetingLink, '_blank')}
                        >
                          <HiOutlineVideoCamera className="w-4 h-4" />
                          <span>Join Meeting</span>
                        </Button>
                      )}
                    </>
                  ) : isFull ? (
                    <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1 py-2">
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                      Session full — no seats left
                    </p>
                  ) : !user ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => toast.error('Please log in to join sessions')}
                    >
                      Log in to Join
                    </Button>
                  ) : !isMegaSessionBookableByLeadTime(session.startTimeUTC) ? (
                    <p className="text-xs text-amber-700 text-center py-2">
                      Bookable from {getMinLeadHours()}+ hours before the session
                    </p>
                  ) : (
                    <Button
                      className="w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 hover:!from-violet-700 hover:!to-indigo-700 !border-0"
                      onClick={() => handleJoinSession(session)}
                      disabled={joiningSession === session._id}
                    >
                      {joiningSession === session._id ? 'Preparing...' : 'Join Session'}
                    </Button>
                  )}
                </MegaSessionCard>
              );
            })}
          </div>
        )}
      </div>

    </MainLayout>
  );
};

export default MegaSessions;