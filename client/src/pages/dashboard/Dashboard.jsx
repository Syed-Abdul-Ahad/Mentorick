import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../../store/hooks';
import { clearUser } from '../../store/slices/authSlice';
import { authService, bookingService } from '../../api';
import SessionSettings from '../../components/booking/SessionSettings';
import { formatDateInTimezone, getUserTimezone } from '../../utils/timezone';

const Dashboard = () => {
  const user = useUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userTimezone] = useState(getUserTimezone());

  const tabs = user?.role === 'mentor' 
    ? [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'sessions', label: 'Session Settings', icon: '⚙️' },
        { id: 'bookings', label: 'My Bookings', icon: '📅' },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'bookings', label: 'My Sessions', icon: '📅' },
      ];

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings({ 
        upcoming: 'true',
        limit: 10 
      });
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no-show': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatParticipants = (booking) => {
    if (user?.role === 'mentor') {
      if (booking.sessionType === '1:1') {
        return `${booking.mentee?.firstName} ${booking.mentee?.lastName}`;
      } else {
        const count = booking.participants?.length || 0;
        return `${count} participant${count !== 1 ? 's' : ''}`;
      }
    } else {
      // For mentees, show mentor name
      return `${booking.mentor?.user?.firstName} ${booking.mentor?.user?.lastName}`;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      dispatch(clearUser());
      navigate('/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header with logout and tabs */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">
                Welcome back, {user?.firstName || user?.name || user?.email}!
              </h2>
              <p className="text-gray-600">
                {user?.role === 'mentor' 
                  ? 'Manage your mentoring sessions and availability.'
                  : 'View your upcoming sessions and book new ones.'
                }
              </p>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-800">Total Sessions</h3>
                  <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-medium text-green-800">Completed</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="font-medium text-yellow-800">Upcoming</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {formatParticipants(booking)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDateInTimezone(booking.scheduledDate, userTimezone)} at {booking.startTime}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent bookings found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && user?.role === 'mentor' && (
          <SessionSettings />
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.role === 'mentor' ? 'My Bookings' : 'My Sessions'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {user?.role === 'mentor' 
                  ? 'Manage your scheduled mentoring sessions'
                  : 'View your upcoming mentoring sessions'
                }
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <span className="ml-2 text-gray-600">Loading bookings...</span>
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {formatParticipants(booking)}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              booking.sessionType === '1:1' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100'
                            }`}>
                              {booking.sessionType === '1:1' ? '1:1 Session' : 'Mega Session'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Date:</span>
                              <br />
                              {formatDateInTimezone(booking.scheduledDate, userTimezone)}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span>
                              <br />
                              {booking.startTime} - {booking.endTime} ({userTimezone})
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span>
                              <br />
                              {booking.duration} minutes
                            </div>
                          </div>

                          {booking.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <span className="font-medium text-gray-700">Notes:</span>
                              <p className="text-gray-600 mt-1">{booking.notes}</p>
                            </div>
                          )}

                          {booking.meetingLink && (
                            <div className="mt-3">
                              <a
                                href={booking.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                              >
                                🔗 Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No bookings found.</p>
                  <p className="text-sm">
                    {user?.role === 'mentor' 
                      ? 'Your scheduled sessions will appear here.'
                      : 'Book your first session with a mentor!'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
