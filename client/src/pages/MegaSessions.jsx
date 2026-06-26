import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiOutlineVideoCamera,
  HiOutlineCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { megaSessionService, paymentService } from '../api';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/shared/Button';
import MegaSessionCard from '../components/megaSession/MegaSessionCard';
import MegaSessionPaymentModal from '../components/megaSession/MegaSessionPaymentModal';

const MegaSessions = () => {
  const { user } = useSelector((state) => state.auth);
  const [megaSessions, setMegaSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningSession, setJoiningSession] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [pendingParticipantBooking, setPendingParticipantBooking] = useState(null);

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

  const handleOpenPayment = (session) => {
    setPaymentSession(session);
  };

  const handleCancelPayment = () => {
    setPaymentSession(null);
    setPendingParticipantBooking(null);
  };

  // Join mega session
  const handleCreateJoinOrder = async (session) => {
    if (!user) {
      toast.error('Please log in to join sessions');
      throw new Error('Please log in to join sessions');
    }

    setJoiningSession(session._id);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await megaSessionService.joinMegaSession(session._id, { timezone });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start payment for this session');
      }

      setPendingParticipantBooking(response.participantBooking);

      const orderResponse = await paymentService.createOrder({
        bookingId: response.participantBooking._id
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create PayPal order');
      }

      return orderResponse.orderID;
    } catch (error) {
      console.error('Join session error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join session';
      toast.error(errorMessage);
      throw error;
    } finally {
      setJoiningSession(null);
    }
  };

  const handleCaptureJoinOrder = async (orderId) => {
    if (!pendingParticipantBooking?._id) {
      throw new Error('Participant booking is missing');
    }

    const response = await paymentService.captureOrder({
      bookingId: pendingParticipantBooking._id,
      orderId
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to complete session payment');
    }

    toast.success('Successfully joined the mega session!');

    const sessionsResponse = await megaSessionService.getMegaSessions({ upcoming: true });
    setMegaSessions(sessionsResponse.megaSessions || []);
    handleCancelPayment();

    return response;
  };


  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Mega Sessions</h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-2xl">
            Join group mentorship sessions with industry experts and connect with fellow learners.
          </p>
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
                  ) : (
                    <Button
                      className="w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 hover:!from-violet-700 hover:!to-indigo-700 !border-0"
                      onClick={() => handleOpenPayment(session)}
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

      <MegaSessionPaymentModal
        isOpen={!!paymentSession}
        session={paymentSession}
        onClose={handleCancelPayment}
        onCreateOrder={() => handleCreateJoinOrder(paymentSession)}
        onApprove={async (data) => {
          await handleCaptureJoinOrder(data.orderID);
        }}
        onCancel={handleCancelPayment}
      />/
    </MainLayout>
  );
};

export default MegaSessions;