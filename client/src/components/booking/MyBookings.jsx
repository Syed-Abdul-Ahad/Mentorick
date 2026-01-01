import { useState, useEffect } from 'react';
import { bookingService } from '../../api';
import { useUser } from '../../store/hooks';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Toast from '../shared/Toast';

const MyBookings = () => {
  const user = useUser();
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchBookings();
    fetchAnalytics();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter === 'upcoming') {
        params.upcoming = 'true';
        params.status = 'confirmed,pending';
      } else if (filter !== 'all') {
        params.status = filter;
      }

      const response = await bookingService.getMyBookings(params);
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await bookingService.getBookingAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const formatDateTime = (utcDate, timezone) => {
    try {
      const date = new Date(utcDate);
      
      // Format date in the specified timezone
      const dateStr = date.toLocaleDateString('en-US', {
        timeZone: timezone || 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const time = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: timezone || 'UTC',
        hour12: true // Show 12-hour format with AM/PM
      });
      
      const day = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        timeZone: timezone || 'UTC'
      });

      return { date: dateStr, time, day };
    } catch (error) {
      console.error('Error formatting date:', error);
      const date = new Date(utcDate);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        day: date.toLocaleDateString('en-US', { weekday: 'long' })
      };
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-primary-500 text-white',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (booking) => {
    return booking.userRole === 'mentor' ? 'As Mentor' : 'As Mentee';
  };

  const getOtherUserName = (booking) => {
    // Handle mega sessions
    if (booking.isMegaSession) {
      return `${booking.title || 'Mega Session'} (${booking.participants?.length || 0}/${booking.maxParticipants} participants)`;
    }
    
    // Handle regular 1:1 sessions
    if (booking.userRole === 'mentor') {
      return booking.mentee ? booking.mentee.firstName + ' ' + booking.mentee.lastName : 'Unknown Mentee';
    }
    return booking.mentor ? booking.mentor.firstName + ' ' + booking.mentor.lastName : 'Unknown Mentor';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const now = new Date();
      return new Date(booking.startTimeUTC) > now && 
             ['pending', 'confirmed'].includes(booking.status);
    }
    return booking.status === filter;
  });

  const otherRole = (booking)=>{
    const role = getRoleLabel(booking);
    if(role==='As Mentor'){
      return 'mentee';
    }
    return 'mentor';
  }


  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Bookings</h1>
        
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Upcoming</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.upcomingBookings}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Completed</h3>
              <p className="text-2xl font-bold text-green-600">
                {analytics.statusBreakdown.completed || 0}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.statusBreakdown.pending || 0}
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total</h3>
              <p className="text-2xl font-bold text-gray-600">
                {Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0)}
              </p>
            </Card>
          </div>
        )}

      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {filter === 'all' ? 'No bookings found' : `No ${filter} bookings found`}
          </p>
          <p className="text-sm text-gray-400">
            {filter === 'upcoming' 
              ? "You don't have any upcoming sessions scheduled."
              : "Your bookings will appear here once you book or receive bookings."
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const timeInfo = formatDateTime(
              booking.startTimeUTC,
              booking.userRole === 'mentor' ? booking.mentorTimezone : booking.menteeTimezone
            );
            
            return (
              <Card key={booking._id} className="p-4 md:p-6 hover:shadow-md transition-shadow border border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-full font-medium">
                      {getRoleLabel(booking)}
                    </span>
                    {booking.isMegaSession && (
                      <span className="text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-600 px-2.5 py-1.5 rounded-full font-medium">
                        Mega Session
                      </span>
                    )}
                  </div>
                  <div className="sm:text-right text-left">
                    <p className="text-lg md:text-xl font-bold text-gray-900">
                      {booking.price.amount} {booking.price.currency}
                    </p>
                    <p className="text-sm text-gray-500">{booking.durationMinutes} minutes</p>
                  </div>
                </div>

                <div className="mb-4">
                  {!booking?.isMegaSession && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                      <span className='text-xs md:text-sm text-gray-500 font-medium'>{otherRole(booking)}</span>
                    </div>
                  )}
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 break-words pl-1">
                    {booking.isMegaSession 
                      ? (booking.title || 'Mega Session') + ` (${booking.participants?.length || 0}/${booking.maxParticipants} participants)`
                      : getOtherUserName(booking) 
                    }
                  </h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-primary-500 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">DATE</span>
                        <span className="text-sm text-gray-600 break-words">{timeInfo.date} ({timeInfo.day})</span>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-primary-500 rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900">TIME</span>
                        <span className="text-sm text-gray-600 break-words">{timeInfo.time} {booking.userRole === 'mentor' ? booking.mentorTimezone : booking.menteeTimezone}</span>
                      </div>
                    </div>

                    {booking.description && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Session Agenda</p>
                        <div className="border-l-4 border-primary-500 bg-gray-50 p-3 text-sm text-gray-700 break-words">
                          {booking.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {booking.meeting?.meetingLink && (
                    <div className="md:ml-6 flex items-start justify-end md:justify-start w-full md:w-auto mt-4 md:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(booking.meeting.meetingLink, '_blank')}
                        className="bg-primary-500 hover:bg-primary-600 text-white border-primary-500 hover:border-primary-600 flex items-center space-x-2 w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47A3 3 0 1015 8z" />
                        </svg>
                        <span>Join Meeting</span>
                      </Button>
                    </div>
                  )}
                </div>

                {booking.status === 'pending' && booking.userRole === 'mentee' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⏳ Waiting for mentor confirmation. You'll receive a meeting link once confirmed.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Toast */}
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

export default MyBookings;