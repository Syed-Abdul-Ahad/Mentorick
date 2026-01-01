import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { megaSessionService } from '../api/services';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

const MegaSessions = () => {
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

  // Join mega session
  const handleJoinSession = async (sessionId) => {
    if (!user) {
      toast.error('Please log in to join sessions');
      return;
    }

    setJoiningSession(sessionId);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await megaSessionService.joinMegaSession(sessionId, { timezone });
      
      console.log('Join session response:', response);
      
      // Check for successful response
      if (response.success || response.message) {
        toast.success(response.message || 'Successfully joined the mega session!');
        
        // Refresh sessions to show updated participant count
        const sessionsResponse = await megaSessionService.getMegaSessions({ upcoming: true });
        setMegaSessions(sessionsResponse.megaSessions || []);
      } else {
        toast.error('Failed to join session');
      }
      
    } catch (error) {
      console.error('Join session error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join session';
      toast.error(errorMessage);
    } finally {
      setJoiningSession(null);
    }
  };

  // Format time for user's timezone
  const formatTimeForUser = (utcTime, userTimezone) => {
    const utcDate = new Date(utcTime);
    
    const userTime = utcDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: userTimezone
    });
    
    const userDate = utcDate.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone
    });
    
    const utcTimeFormatted = utcDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'
    });
    
    return {
      userLocal: userTime,
      userDate: userDate,
      utc: utcTimeFormatted + ' UTC +00'
    };
  };

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mega Sessions</h1>
          <p className="text-gray-600">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {megaSessions.map((session) => {
              const timeInfo = formatTimeForUser(session.startTimeUTC, userTimezone);
              // Check if user is joined using both _id and id for compatibility
              const isUserJoined = session.participants?.some(p => 
                p._id === user?._id || p._id === user?.id || p.id === user?._id || p.id === user?.id
              );
              const isFull = session.participants?.length >= session.maxParticipants;
              const canJoin = user && !isUserJoined && !isFull;

              return (
                <Card key={session._id} className="p-6">
                  {/* Session Header */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{session.description}</p>
                  </div>

                  {/* Mentor Info */}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium text-sm">
                        <img src={session.mentorProfile?.headshot || ''} alt={session.mentorProfile?.fullName || 'Mentor'} className="w-10 h-10 rounded-full object-cover" />
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.mentorProfile?.fullName}</p>
                      <p className="text-sm text-gray-600">{session.mentorProfile?.title}</p>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <span className="text-gray-900 font-medium">{timeInfo.userLocal}</span>
                        <span className="text-gray-600 ml-1">on {timeInfo.userDate}</span>
                        <div className="text-xs text-gray-500">{timeInfo.utc}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{session.durationMinutes} minutes</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-gray-600">
                        {session.participants?.length || 0} / {session.maxParticipants} participants
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-gray-600">
                        {session.price.amount} {session.price.currency}
                      </span>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="space-y-2">
                    {isUserJoined ? (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-800 font-medium">Already Joined</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            You are registered for this mega session.
                          </p>
                        </div>
                        {/* Meeting Link Button for Joined Users */}
                        {session.meeting?.meetingLink && (
                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center space-x-2"
                            onClick={() => window.open(session.meeting.meetingLink, '_blank')}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47A3 3 0 1015 8z" />
                            </svg>
                            <span>Join Meeting</span>
                          </Button>
                        )}
                      </>
                    ) : isFull ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-red-800 font-medium">Session Full</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          This session has reached maximum capacity.
                        </p>
                      </div>
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
                        className="w-full"
                        onClick={() => handleJoinSession(session._id)}
                        disabled={joiningSession === session._id}
                      >
                        {joiningSession === session._id ? 'Joining...' : 'Join Session'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MegaSessions;