import { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineQueueList,
  HiOutlineVideoCamera,
} from 'react-icons/hi2';
import { bookingService } from '../../api';
import Card from '../shared/Card';
import Toast from '../shared/Toast';
import BookingCard from './BookingCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'cancelled', label: 'Cancelled' },
];

/** Decorative video-call art for bookings hero */
const BookingsBannerArt = () => (
  <svg
    viewBox="0 0 280 160"
    className="h-full w-full max-h-40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <ellipse cx="188" cy="122" rx="80" ry="16" fill="#86efac" opacity="0.32" />
    <path
      d="M40 118c34-18 70-12 104 2 32 12 64 4 96-14"
      stroke="#4ade80"
      strokeWidth="10"
      strokeLinecap="round"
      opacity="0.28"
    />
    {/* Main video window */}
    <g transform="translate(98 28) rotate(-6 70 48)">
      <rect x="0" y="0" width="140" height="96" rx="16" fill="#166534" />
      <rect x="10" y="10" width="120" height="76" rx="10" fill="#15803d" />
      {/* Soft screen glow */}
      <rect x="18" y="18" width="104" height="52" rx="8" fill="#22c55e" opacity="0.35" />
      {/* Two participant bubbles */}
      <circle cx="52" cy="44" r="14" fill="#bbf7d0" />
      <circle cx="88" cy="44" r="14" fill="#86efac" />
      <rect x="28" y="72" width="84" height="8" rx="4" fill="#bbf7d0" opacity="0.7" />
    </g>
    {/* Floating camera chip */}
    <g transform="translate(64 64) rotate(14 36 28)">
      <rect x="0" y="8" width="58" height="40" rx="10" fill="#22c55e" />
      <path d="M58 18l22-10v32L58 30V18z" fill="#4ade80" />
      <circle cx="28" cy="28" r="10" fill="#f0fdf4" opacity="0.95" />
      <circle cx="28" cy="28" r="5" fill="#166534" />
    </g>
  </svg>
);

const BookingsHeroBanner = () => (
  <section className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 via-primary-50/90 to-emerald-100/80">
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 20%, rgba(74,222,128,0.35), transparent 42%), radial-gradient(circle at 88% 30%, rgba(34,197,94,0.22), transparent 40%)',
      }}
    />
    <div className="relative flex items-center gap-4 sm:gap-6 px-5 sm:px-8 py-6 sm:py-7">
      <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-sm shadow-primary-500/25">
        <HiOutlineCalendarDays className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">My Bookings</h1>
        <p className="mt-1.5 text-sm sm:text-[15px] text-gray-600 max-w-xl leading-relaxed">
          Manage your mentoring sessions and track upcoming appointments.
        </p>
      </div>
      <div className="hidden md:block w-52 lg:w-64 shrink-0 self-stretch">
        <BookingsBannerArt />
      </div>
    </div>
  </section>
);

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchBookings();
    fetchAnalytics();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings({ limit: 200 });
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

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((booking) => {
      if (filter === 'all') return true;
      if (filter === 'upcoming') {
        return (
          new Date(booking.startTimeUTC) > now &&
          ['pending', 'confirmed'].includes(booking.status)
        );
      }
      return booking.status === filter;
    });
  }, [bookings, filter]);

  const filterCounts = useMemo(() => {
    const now = new Date();
    const counts = {
      all: bookings.length,
      upcoming: 0,
      confirmed: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
    };
    bookings.forEach((b) => {
      if (counts[b.status] != null) counts[b.status] += 1;
      if (
        new Date(b.startTimeUTC) > now &&
        ['pending', 'confirmed'].includes(b.status)
      ) {
        counts.upcoming += 1;
      }
    });
    return counts;
  }, [bookings]);

  const statCards = analytics
    ? [
        {
          label: 'Upcoming',
          value: analytics.upcomingBookings,
          icon: HiOutlineClock,
          iconClass: 'text-primary-600',
        },
        {
          label: 'Completed',
          value: analytics.statusBreakdown.completed || 0,
          icon: HiOutlineCheckCircle,
          iconClass: 'text-primary-700',
        },
        {
          label: 'Pending',
          value: analytics.statusBreakdown.pending || 0,
          icon: HiOutlineVideoCamera,
          iconClass: 'text-amber-500',
        },
        {
          label: 'Total',
          value: Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0),
          icon: HiOutlineQueueList,
          iconClass: 'text-sky-600',
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <BookingsHeroBanner />
      </div>

      <div className="mb-6 flex justify-end">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium text-gray-500">Filter</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            {FILTERS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
                {filterCounts[opt.id] != null ? ` (${filterCounts[opt.id]})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
              >
                <Icon className={`h-6 w-6 ${stat.iconClass}`} strokeWidth={1.5} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

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
              : 'Try another filter, or book a new session to see it here.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
