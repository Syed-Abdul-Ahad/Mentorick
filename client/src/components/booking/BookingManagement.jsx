import { useState, useEffect } from 'react';
import { bookingService } from '../../api';
import { formatDateInTimezone, getUserTimezone } from '../../utils/timezone';
import { useUser } from '../../store/hooks';
import Button from '../shared/Button';
import FormInput from '../shared/FormInput';
import Toast from '../shared/Toast';

const BookingManagement = () => {
  const user = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userTimezone] = useState(getUserTimezone());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [meetingData, setMeetingData] = useState({
    meetingLink: '',
    meetingPlatform: 'zoom',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings({ 
        upcoming: 'true',
        limit: 50 
      });
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await bookingService.updateBookingStatus(selectedBooking._id, meetingData);
      showToast('Booking updated successfully');
      setShowModal(false);
      fetchBookings();
      resetModal();
    } catch (error) {
      console.error('Error updating booking:', error);
      showToast(error.response?.data?.message || 'Failed to update booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, reason = '') => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(bookingId, { reason });
        showToast('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        showToast('Failed to cancel booking', 'error');
      }
    }
  };

  const openUpdateModal = (booking) => {
    setSelectedBooking(booking);
    setMeetingData({
      meetingLink: booking.meetingLink || '',
      meetingPlatform: booking.meetingPlatform || 'zoom',
      status: booking.status
    });
    setShowModal(true);
  };

  const resetModal = () => {
    setSelectedBooking(null);
    setMeetingData({
      meetingLink: '',
      meetingPlatform: 'zoom',
      status: 'confirmed'
    });
    setShowModal(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      case 'no-show': return '👻';
      default: return '📅';
    }
  };

  const formatParticipants = (booking) => {
    if (user?.role === 'mentor') {
      return `${booking.mentee?.firstName} ${booking.mentee?.lastName}`;
    } else {
      return `${booking.mentor?.user?.firstName} ${booking.mentor?.user?.lastName}`;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      formatParticipants(booking).toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.role === 'mentor' ? 'My Bookings' : 'My Sessions'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'mentor' 
                ? 'Manage your scheduled mentoring sessions and add meeting details'
                : 'View your upcoming mentoring sessions and session details'
              }
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <FormInput
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { key: 'all', label: 'Total', icon: '📊', color: 'blue' },
          { key: 'confirmed', label: 'Confirmed', icon: '✅', color: 'green' },
          { key: 'completed', label: 'Completed', icon: '🎉', color: 'purple' },
          { key: 'pending', label: 'Pending', icon: '⏳', color: 'yellow' },
          { key: 'cancelled', label: 'Cancelled', icon: '❌', color: 'red' }
        ].map(({ key, label, icon, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`bg-white rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
              filter === key 
                ? `border-${color}-500 shadow-md` 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-bold text-lg text-gray-900">{statusCounts[key]}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {filter === 'all' ? 'All Bookings' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings`}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'})
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 text-lg">Loading bookings...</span>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="text-2xl">{getStatusIcon(booking.status)}</div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {formatParticipants(booking)}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 border border-primary-200">
                            {booking.duration} minutes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-1">📅 Date</div>
                        <div className="text-gray-900">
                          {formatDateInTimezone(booking.scheduledDate, userTimezone)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-1">⏰ Time</div>
                        <div className="text-gray-900">
                          {booking.startTime} - {booking.endTime}
                        </div>
                        <div className="text-xs text-gray-500">{userTimezone}</div>
                      </div>

                      {booking.meetingPlatform && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm font-semibold text-gray-700 mb-1">💻 Platform</div>
                          <div className="text-gray-900 capitalize">{booking.meetingPlatform}</div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="text-sm font-semibold text-blue-800 mb-2">📝 Session Notes</div>
                        <div className="text-blue-700">{booking.notes}</div>
                      </div>
                    )}

                    {/* Meeting Link */}
                    {booking.meetingLink && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <div className="text-sm font-semibold text-green-800 mb-2">🔗 Meeting Link</div>
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:text-green-800 underline break-all"
                        >
                          {booking.meetingLink}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 lg:ml-6">
                    {user?.role === 'mentor' && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <Button
                        onClick={() => openUpdateModal(booking)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                      >
                        Update
                      </Button>
                    )}
                    
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <Button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                      >
                        Cancel
                      </Button>
                    )}

                    {booking.meetingLink && (
                      <Button
                        onClick={() => window.open(booking.meetingLink, '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                      >
                        Join Meeting
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? user?.role === 'mentor' 
                  ? 'Your scheduled sessions will appear here.'
                  : 'Your booked sessions will appear here.'
                : `No ${filter} bookings found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Update Booking Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Update Booking</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateBooking} className="space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Status
                </label>
                <select
                  value={meetingData.status}
                  onChange={(e) => setMeetingData({ ...meetingData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              {/* Meeting Platform */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Meeting Platform
                </label>
                <select
                  value={meetingData.meetingPlatform}
                  onChange={(e) => setMeetingData({ ...meetingData, meetingPlatform: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Meeting Link */}
              <FormInput
                label="Meeting Link"
                type="url"
                value={meetingData.meetingLink}
                onChange={(e) => setMeetingData({ ...meetingData, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/123456789"
              />

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Update Booking'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
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

export default BookingManagement;
