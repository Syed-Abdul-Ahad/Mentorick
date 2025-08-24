import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ApiService from '../../api/ApiService';
import Button from '../shared/Button';
import Toast from '../shared/Toast';
import { formatDateInTimezone, getUserTimezone } from '../../utils/timezone';

const MegaSessions = () => {
  const { user } = useSelector(state => state.auth);
  const [megaSessions, setMegaSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [userTimezone] = useState(getUserTimezone());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchMegaSessions();
  }, [filter]);

  const fetchMegaSessions = async () => {
    try {
      setLoading(true);
      const params = filter === 'upcoming' ? '?upcoming=true&status=scheduled' : '';
      const response = await ApiService.get(`/mega-sessions${params}`);
      
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
    try {
      const response = await ApiService.put(`/mega-sessions/${sessionId}/join`);
      
      if (response.data && response.data.status === 'success') {
        showToast('Successfully joined the mega session!');
        fetchMegaSessions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error joining session:', error);
      showToast(error.response?.data?.message || 'Failed to join session', 'error');
    }
  };

  const handleLeaveSession = async (sessionId) => {
    try {
      const response = await ApiService.put(`/mega-sessions/${sessionId}/leave`);
      
      if (response.data && response.data.status === 'success') {
        showToast('Successfully left the mega session');
        fetchMegaSessions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error leaving session:', error);
      showToast(error.response?.data?.message || 'Failed to leave session', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const isUserParticipant = (session) => {
    return session.participants?.some(p => p.user._id === user?.id);
  };

  const canJoinSession = (session) => {
    return session.status === 'scheduled' && 
           session.participants?.length < session.maxParticipants &&
           !isUserParticipant(session);
  };

  if (loading && megaSessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mega Sessions</h1>
        <p className="text-gray-600 mb-4">
          Join group mentoring sessions with expert mentors. Learn alongside other mentees in interactive sessions.
        </p>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming Sessions
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Sessions
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {megaSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No mega sessions found</h3>
          <p className="text-gray-500">
            {filter === 'upcoming' 
              ? 'No upcoming mega sessions are scheduled at the moment.' 
              : 'No mega sessions are available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {megaSessions.map((session) => (
            <div key={session._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Session Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {session.title}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    session.status === 'active' ? 'bg-green-100 text-green-800' :
                    session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {session.status}
                  </span>
                </div>

                {session.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {session.description}
                  </p>
                )}

                {/* Mentor Info */}
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.mentor?.user?.firstName?.charAt(0)}
                      {session.mentor?.user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {session.mentor?.user?.firstName} {session.mentor?.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Mentor</p>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateInTimezone(session.scheduledDate, userTimezone)}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {session.startTime} - {session.endTime} ({userTimezone})
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {session.participants?.length || 0} / {session.maxParticipants} participants
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {session.price > 0 ? `${session.currency} ${session.price}` : 'Free'}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {session.meetingPlatform}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t">
                  {isUserParticipant(session) ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        You're registered
                      </div>
                      {session.status === 'scheduled' && (
                        <Button
                          onClick={() => handleLeaveSession(session._id)}
                          className="btn-secondary w-full text-sm"
                        >
                          Leave Session
                        </Button>
                      )}
                      {session.status === 'active' && session.meetingLink && (
                        <Button
                          onClick={() => window.open(session.meetingLink, '_blank')}
                          className="btn-primary w-full text-sm"
                        >
                          Join Meeting
                        </Button>
                      )}
                    </div>
                  ) : canJoinSession(session) ? (
                    <Button
                      onClick={() => handleJoinSession(session._id)}
                      className="btn-primary w-full text-sm"
                    >
                      Join Session
                    </Button>
                  ) : session.status === 'scheduled' && session.participants?.length >= session.maxParticipants ? (
                    <Button
                      disabled
                      className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed"
                    >
                      Session Full
                    </Button>
                  ) : session.status === 'completed' ? (
                    <Button
                      disabled
                      className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed"
                    >
                      Completed
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed"
                    >
                      Not Available
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
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

export default MegaSessions;
