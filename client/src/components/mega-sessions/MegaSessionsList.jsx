import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ApiService from '../../api/ApiService';
import Button from '../shared/Button';
import Toast from '../shared/Toast';

const MegaSessionsList = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [megaSessions, setMegaSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joiningSession, setJoiningSession] = useState(null);
  const [leavingSession, setLeavingSession] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchMegaSessions();
  }, []);

  const fetchMegaSessions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/bookings/mega-sessions?upcoming=true');
      if (response.data && response.data.status === 'success') {
        setMegaSessions(response.data.data.megaSessions || []);
      }
    } catch (error) {
      console.error('Error fetching mega sessions:', error);
      showToast('Failed to load mega sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    if (!isAuthenticated) {
      showToast('Please login to join mega sessions', 'error');
      return;
    }

    try {
      setJoiningSession(sessionId);
      const response = await ApiService.post(`/bookings/mega-sessions/${sessionId}/join`);
      
      if (response.data && response.data.status === 'success') {
        showToast('Successfully joined mega session!', 'success');
        fetchMegaSessions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error joining mega session:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join mega session';
      showToast(errorMessage, 'error');
    } finally {
      setJoiningSession(null);
    }
  };

  const handleLeaveSession = async (sessionId) => {
    if (!confirm('Are you sure you want to leave this mega session?')) {
      return;
    }

    try {
      setLeavingSession(sessionId);
      await ApiService.delete(`/bookings/mega-sessions/${sessionId}/leave`);
      showToast('Successfully left mega session', 'success');
      fetchMegaSessions(); // Refresh the list
    } catch (error) {
      console.error('Error leaving mega session:', error);
      const errorMessage = error.response?.data?.message || 'Failed to leave mega session';
      showToast(errorMessage, 'error');
    } finally {
      setLeavingSession(null);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUserParticipant = (session) => {
    if (!isAuthenticated || !session.participants) return false;
    return session.participants.some(p => p.user._id === user.id);
  };

  const isSessionFull = (session) => {
    return session.participants.length >= session.maxParticipants;
  };

  const isSessionStarted = (session) => {
    const now = new Date();
    const sessionDateTime = new Date(session.scheduledDate);
    const [hours, minutes] = session.startTime.split(':');
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes));
    return sessionDateTime <= now;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mega Sessions</h1>
          <p className="text-gray-600">
            Join group mentoring sessions with industry experts. Learn alongside other mentees in an interactive environment.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading mega sessions...</p>
          </div>
        ) : megaSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Mega Sessions Available</h3>
            <p>Check back later for upcoming group mentoring sessions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {megaSessions.map(session => {
              const userIsParticipant = isUserParticipant(session);
              const sessionFull = isSessionFull(session);
              const sessionStarted = isSessionStarted(session);
              
              return (
                <div key={session._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {session.title}
                      </h2>
                      {session.description && (
                        <p className="text-gray-600 mb-4">{session.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Mentor:</span>
                          <p className="text-gray-900">
                            {session.mentor?.user?.firstName} {session.mentor?.user?.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <p className="text-gray-900">{formatDate(session.scheduledDate)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Time:</span>
                          <p className="text-gray-900">
                            {formatTime(session.startTime)} ({session.duration} min)
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Participants:</span>
                          <p className={`text-gray-900 ${sessionFull ? 'text-red-600 font-medium' : ''}`}>
                            {session.participantsCount || 0} / {session.maxParticipants}
                            {sessionFull && <span className="text-red-500 ml-1">(Full)</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        session.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'confirmed' ? 'Upcoming' : 
                         session.status === 'active' ? 'Live' : session.status}
                      </span>

                      {isAuthenticated && (
                        <div>
                          {userIsParticipant ? (
                            <div className="space-y-2">
                              <div className="flex items-center text-green-600 text-sm">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Registered
                              </div>
                              {!sessionStarted && (
                                <Button
                                  onClick={() => handleLeaveSession(session._id)}
                                  disabled={leavingSession === session._id}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  {leavingSession === session._id ? 'Leaving...' : 'Leave'}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleJoinSession(session._id)}
                              disabled={
                                joiningSession === session._id || 
                                sessionFull || 
                                sessionStarted ||
                                session.status !== 'confirmed'
                              }
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                              size="sm"
                            >
                              {joiningSession === session._id ? 'Joining...' :
                               sessionFull ? 'Full' :
                               sessionStarted ? 'Started' :
                               'Join Session'}
                            </Button>
                          )}
                        </div>
                      )}

                      {!isAuthenticated && (
                        <Button
                          onClick={() => showToast('Please login to join mega sessions', 'error')}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          Login to Join
                        </Button>
                      )}
                    </div>
                  </div>

                  {session.participants && session.participants.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Registered Participants ({session.participants.length}):
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {session.participants.slice(0, 10).map((participant, index) => (
                          <span 
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {participant.user?.firstName} {participant.user?.lastName}
                          </span>
                        ))}
                        {session.participants.length > 10 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{session.participants.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default MegaSessionsList;
