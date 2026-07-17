import { useState, useEffect } from 'react';
import { bookingService } from '../../api';
import Card from '../shared/Card';
import Toast from '../shared/Toast';
import BookingCard from './BookingCard';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter] = useState('all');
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
      const tz = timezone || 'UTC';

      const dateStr = date.toLocaleDateString('en-US', {
        timeZone: tz,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz,
        hour12: true,
      });

      const day = date.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: tz,
      });

      return { date: dateStr, time, day };
    } catch (error) {
      console.error('Error formatting date:', error);
      const date = new Date(utcDate);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      };
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const now = new Date();
      return (
        new Date(booking.startTimeUTC) > now &&
        ['pending', 'confirmed'].includes(booking.status)
      );
    }
    return booking.status === filter;
  });

  const statCards = analytics
    ? [
        { label: 'Upcoming', value: analytics.upcomingBookings },
        { label: 'Completed', value: analytics.statusBreakdown.completed || 0 },
        { label: 'Pending', value: analytics.statusBreakdown.pending || 0 },
        {
          label: 'Total',
          value: Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0),
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your mentoring sessions and track upcoming appointments
        </p>

        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </header>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-500 mx-auto" />
          <p className="text-gray-500 mt-4 text-sm">Loading your bookings…</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="text-center py-16 !p-8" hover={false}>
          <p className="text-gray-600 text-lg font-medium mb-2">
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {filter === 'upcoming'
              ? "You don't have any upcoming sessions scheduled."
              : 'Your bookings will appear here once you book or receive sessions.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBookings.map((booking) => {
            const userTimezone =
              booking.userRole === 'mentor' ? booking.mentorTimezone : booking.menteeTimezone;

            const timeInfo = formatDateTime(booking.startTimeUTC, userTimezone);
            const utcTimeInfo = formatDateTime(booking.startTimeUTC, 'UTC');

            return (
              <BookingCard
                key={booking._id}
                booking={booking}
                timeInfo={timeInfo}
                utcTimeInfo={utcTimeInfo}
                userTimezone={userTimezone}
              />
            );
          })}
        </div>
      )}

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
