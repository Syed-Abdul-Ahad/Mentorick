import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { useUser } from '../../store/hooks';
import { clearUser } from '../../store/slices/authSlice';
import { authService, bookingService, megaSessionService, paymentService } from '../../api';
import MainLayout from '../../components/layout/MainLayout';
import toast from 'react-hot-toast';
import { formatDurationLabel } from '../../utils/durationDisplay';
import Seo from '../../components/seo/Seo';
import DashboardPaymentsTab from '../../components/dashboard/DashboardPaymentsTab';

const STATUS_DOT = {
  completed: 'bg-blue-500',
  confirmed: 'bg-emerald-500',
  pending: 'bg-amber-500',
  cancelled: 'bg-red-400',
  'no-show': 'bg-gray-400',
};

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatSessionTime = (utcDate, timezone) => {
  const date = new Date(utcDate);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  let dayLabel;
  if (isToday) dayLabel = 'Today';
  else if (isTomorrow) dayLabel = 'Tomorrow';
  else {
    dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz });
  }

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  });

  return `${dayLabel}, ${time}`;
};

const formatMegaSessionSchedule = (utcDate, timezone) => {
  const date = new Date(utcDate);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz,
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  });
  return { dateStr, time, tz };
};

const StatCard = ({ label, value, suffix = '' }) => (
  <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
    <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
      {value}
      {suffix && <span className="text-base font-semibold text-gray-400 ml-1">{suffix}</span>}
    </p>
  </div>
);

const getRoleStats = (analytics, role) => {
  if (!analytics) return [];

  if (role === 'admin') {
    const ps = analytics.platformStats || {};
    return [
      { label: 'Total bookings', value: ps.totalBookings ?? 0 },
      { label: 'Active mentors', value: ps.totalMentors ?? 0 },
      { label: 'Mega sessions', value: ps.totalMegaSessions ?? 0 },
      { label: 'Pending bookings', value: ps.pendingBookings ?? 0 },
    ];
  }

  if (role === 'mentor') {
    return [
      { label: 'Upcoming', value: analytics.upcomingBookings ?? 0 },
      { label: 'Completed', value: analytics.completedSessions ?? 0 },
      { label: 'Hours mentored', value: analytics.totalHours ?? 0 },
      { label: 'Active mentees', value: analytics.uniqueMentees ?? 0 },
    ];
  }

  return [
    { label: 'Upcoming', value: analytics.upcomingBookings ?? 0 },
    { label: 'Completed', value: analytics.completedSessions ?? 0 },
    { label: 'Hours learned', value: analytics.totalHours ?? 0 },
    { label: 'Mentors connected', value: analytics.uniqueMentors ?? 0 },
  ];
};

const getWelcomeCopy = (role, firstName) => {
  const name = firstName || 'there';
  if (role === 'admin') {
    return {
      title: `Welcome back, ${name}`,
      subtitle: 'Platform overview and session management at a glance.',
    };
  }
  if (role === 'mentor') {
    return {
      title: `Welcome back, ${name}`,
      subtitle: 'Your mentoring activity, upcoming sessions, and earnings in one place.',
    };
  }
  return {
    title: `Welcome back, ${name}`,
    subtitle: 'Track your sessions, discover mentors, and continue your growth.',
  };
};

const getQuickActions = (role, navigate) => {
  if (role === 'admin') {
    return [
      { label: 'Manage mega sessions', onClick: () => navigate('/admin/mega-sessions') },
      { label: 'View mentors', onClick: () => navigate('/mentors'), variant: 'secondary' },
    ];
  }
  if (role === 'mentor') {
    return [
      { label: 'Session settings', onClick: () => navigate('/sessions') },
      { label: 'My bookings', onClick: () => navigate('/my-bookings'), variant: 'secondary' },
    ];
  }
  return [
    { label: 'Find mentors', onClick: () => navigate('/mentors') },
    { label: 'My bookings', onClick: () => navigate('/my-bookings'), variant: 'secondary' },
  ];
};

const Dashboard = () => {
  const user = useUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'overview';

  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [pendingMegaSessions, setPendingMegaSessions] = useState([]);
  const [loadingPendingMega, setLoadingPendingMega] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchPendingMegaSessions = async () => {
    if (user?.role !== 'mentor') return;
    setLoadingPendingMega(true);
    try {
      const response = await megaSessionService.getPendingMegaSessions();
      setPendingMegaSessions(response.pendingSessions || []);
    } catch (error) {
      console.error('Error fetching pending mega sessions:', error);
    } finally {
      setLoadingPendingMega(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      const response = await bookingService.getBookingAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
    }
    await fetchPendingMegaSessions();
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const response = await bookingService.getBookingAnalytics();
        setAnalytics(response.analytics);
      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
    if (user?.role === 'mentor') {
      fetchPendingMegaSessions();
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'mentor' && currentTab === 'mega-sessions') {
      fetchPendingMegaSessions();
    }
  }, [user?.role, currentTab]);

  const handleAcceptMegaSession = async (sessionId) => {
    setActionId(sessionId);
    try {
      await megaSessionService.acceptMegaSession(sessionId);
      toast.success('Mega session accepted and published');
      await refreshDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to accept mega session');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectMegaSession = async (sessionId) => {
    setActionId(sessionId);
    try {
      await megaSessionService.rejectMegaSession(sessionId);
      toast.success('Mega session rejected');
      await refreshDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to reject mega session');
    } finally {
      setActionId(null);
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

  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerifyPayment = async (bookingId) => {
    try {
      setVerifyingId(bookingId);
      const res = await paymentService.verifyPayment(bookingId);
      if (!res.success) throw new Error(res.error || 'Verification failed');
      toast.success('Payment verified — booking confirmed');
      const response = await bookingService.getBookingAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRejectPayment = async (bookingId) => {
    try {
      setVerifyingId(bookingId);
      const res = await paymentService.rejectPayment(bookingId, 'Payment proof rejected — please book again with a clearer screenshot');
      if (!res.success) throw new Error(res.error || 'Rejection failed');
      toast.success('Payment rejected — slot released');
      const response = await bookingService.getBookingAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      toast.error(error.message || 'Failed to reject payment');
    } finally {
      setVerifyingId(null);
    }
  };

  const welcome = getWelcomeCopy(user?.role, user?.firstName);
  const stats = getRoleStats(analytics, user?.role);
  const actions = getQuickActions(user?.role, navigate);
  const earnings = analytics?.mentorEarnings?.[0];
  const spending = analytics?.menteeSpending?.[0];
  const upcomingSessionsDisplay = (analytics?.upcomingSessions || []).filter(
    (session) => !(user?.role === 'mentor' && session.isMegaSession && session.status === 'pending')
  );

  return (
    <MainLayout>
      <Seo
        title="Dashboard | Mentorick"
        description="Your Mentorick dashboard for bookings, sessions, and account settings."
        canonical="/dashboard"
        noindex
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5 capitalize">{user?.role} account</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>

        {/* Dashboard tabs — overview stays default; Payments is additive for all roles */}
        <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'payments', label: 'Payments' },
            ...(user?.role === 'mentor'
              ? [{ id: 'mega-sessions', label: 'Mega sessions', count: pendingMegaSessions.length }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === tab.id
                  ? 'text-gray-900 border-primary-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {currentTab === 'payments' && <DashboardPaymentsTab role={user?.role} />}

        {currentTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome */}
            <section className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {welcome.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-xl leading-relaxed">
                {welcome.subtitle}
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={
                      action.variant === 'secondary'
                        ? 'px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors'
                        : 'px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-colors'
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Stats */}
            {loadingAnalytics ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
                    <div className="h-8 bg-gray-100 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <StatCard key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
            )}

            {/* Role-specific earnings strip */}
            {!loadingAnalytics && user?.role === 'mentor' && earnings && (
              <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Your earnings (70% after platform fee)
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5 tabular-nums">
                    {Number(earnings.total).toFixed(2)}{' '}
                    <span className="text-sm font-semibold text-gray-400">{earnings._id}</span>
                  </p>
                  {earnings.gross != null && (
                    <p className="text-xs text-gray-400 mt-1">
                      Gross {Number(earnings.gross).toFixed(2)} · Platform fee{' '}
                      {Number(earnings.platformFees || 0).toFixed(2)}
                    </p>
                  )}
                </div>
                <HiOutlineChartBar className="w-5 h-5 text-gray-300" />
              </div>
            )}
            {!loadingAnalytics && user?.role === 'mentee' && spending && (
              <div className="rounded-2xl border border-gray-200/80 bg-white px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total invested</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5 tabular-nums">
                    {Number(spending.total).toFixed(2)}{' '}
                    <span className="text-sm font-semibold text-gray-400">{spending._id}</span>
                  </p>
                </div>
                <HiOutlineChartBar className="w-5 h-5 text-gray-300" />
              </div>
            )}
            {!loadingAnalytics && user?.role === 'admin' && analytics?.platformStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200/80 bg-white px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total users</p>
                  <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{analytics.platformStats.totalUsers}</p>
                </div>
                <div className="rounded-2xl border border-gray-200/80 bg-white px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Confirmed sessions</p>
                  <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">{analytics.platformStats.confirmedBookings}</p>
                </div>
                <div className="rounded-2xl border border-gray-200/80 bg-white px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Awaiting payment review</p>
                  <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
                    {analytics.platformStats.awaitingVerificationCount ?? analytics.awaitingVerification?.length ?? 0}
                  </p>
                </div>
              </div>
            )}

            {/* Admin payment verification queue */}
            {user?.role === 'admin' && analytics?.awaitingVerification?.length > 0 && (
              <section className="rounded-2xl border border-amber-200/80 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Payment proofs to review
                </h3>
                <ul className="space-y-4">
                  {analytics.awaitingVerification.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.menteeName} → {item.mentorName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.amount} {item.currency}
                          {item.platformFee != null && (
                            <> · fee {item.platformFee} · mentor {item.mentorPayoutAmount}</>
                          )}
                        </p>
                        {item.proofImageUrl && (
                          <a
                            href={item.proofImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                          >
                            View screenshot
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={verifyingId === item.id}
                          onClick={() => handleVerifyPayment(item.id)}
                          className="px-3 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          disabled={verifyingId === item.id}
                          onClick={() => handleRejectPayment(item.id)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Activity + Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent activity */}
              <section className="rounded-2xl border border-gray-200/80 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recent activity</h3>
                {loadingAnalytics ? (
                  <div className="mt-5 space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : analytics?.recentActivity?.length > 0 ? (
                  <ul className="mt-5 divide-y divide-gray-100">
                    {analytics.recentActivity.map((item) => (
                      <li key={item.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[item.status] || 'bg-gray-300'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 leading-snug">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.timestamp)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-gray-400">No recent activity yet.</p>
                )}
              </section>

              {/* Upcoming sessions */}
              <section className="rounded-2xl border border-gray-200/80 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Upcoming sessions</h3>
                {loadingAnalytics ? (
                  <div className="mt-5 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : upcomingSessionsDisplay.length > 0 ? (
                  <ul className="mt-5 divide-y divide-gray-100">
                    {upcomingSessionsDisplay.map((session) => (
                      <li key={session.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {session.otherName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatSessionTime(session.startTimeUTC, session.timezone)}
                            </p>
                            {session.title && !session.isMegaSession && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{session.title}</p>
                            )}
                            {session.isMegaSession && (
                              <p className="text-xs text-violet-600 mt-0.5">Mega session</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">
                              {formatDurationLabel(session.durationMinutes)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 capitalize">{session.status}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-gray-400">No upcoming sessions scheduled.</p>
                )}
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="mt-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View all bookings
                  <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              </section>
            </div>

            {/* Admin quick links */}
            {user?.role === 'admin' && (
              <section className="rounded-2xl border border-gray-200/80 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick access</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Mega sessions', desc: 'Create and manage group sessions', icon: HiOutlineSparkles, href: '/admin/mega-sessions' },
                    { label: 'Browse mentors', desc: 'View all mentor profiles', icon: HiOutlineAcademicCap, href: '/mentors' },
                    { label: 'All bookings', desc: 'Review platform bookings', icon: HiOutlineCalendarDays, href: '/my-bookings' },
                  ].map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.label}
                        onClick={() => navigate(link.href)}
                        className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 text-left transition-colors"
                      >
                        <Icon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{link.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {currentTab === 'mega-sessions' && user?.role === 'mentor' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <HiOutlineSparkles className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Mega session requests</h2>
              </div>
              <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                Admin-assigned group sessions appear here for your review. Accept to publish them
                to users and create the calendar event, or reject to release the time slot.
              </p>
            </div>

            {loadingPendingMega ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-48 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-full max-w-md mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                ))}
              </div>
            ) : pendingMegaSessions.length === 0 ? (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-10 text-center">
                <p className="text-sm font-medium text-gray-700">No pending requests</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  When an admin schedules a mega session for you, it will show up here for approval.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {pendingMegaSessions.map((session) => {
                  const schedule = formatMegaSessionSchedule(
                    session.startTimeUTC,
                    session.mentorTimezone
                  );
                  const adminName = session.createdBy
                    ? `${session.createdBy.firstName} ${session.createdBy.lastName}`
                    : 'Admin';
                  const isProcessing = actionId === session._id;

                  return (
                    <li
                      key={session._id}
                      className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <span className="text-xs font-medium text-amber-700">Awaiting approval</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {session.title || 'Mega Session'}
                            </h3>
                            <p className="text-sm text-gray-400 mt-0.5">Requested by {adminName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-gray-900 tabular-nums leading-none">
                              {session.price?.amount}
                              <span className="text-sm font-semibold text-gray-400 ml-1">{session.price?.currency}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{formatDurationLabel(session.durationMinutes)}</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 space-y-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Schedule</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{schedule.dateStr}</p>
                            <p className="text-sm text-gray-600">
                              {schedule.time}
                              <span className="text-gray-400"> · {schedule.tz}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Capacity</p>
                            <p className="text-sm text-gray-700 mt-0.5">
                              Up to {session.maxParticipants} participants
                            </p>
                          </div>
                          {session.description && (
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Description</p>
                              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{session.description}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-5 pt-4 border-t border-gray-100">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAcceptMegaSession(session._id)}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
                          >
                            Accept session
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRejectMegaSession(session._id)}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Dashboard;
