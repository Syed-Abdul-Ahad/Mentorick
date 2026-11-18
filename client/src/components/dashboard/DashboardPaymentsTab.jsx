import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineUsers,
  HiOutlineWallet,
} from 'react-icons/hi2';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { bookingService } from '../../api';

const QUICK_STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Successful' },
  { value: 'awaiting_verification', label: 'Pending' },
  { value: 'rejected', label: 'Failed' },
];

const CURRENCY_OPTIONS = [
  { value: 'all', label: 'All currencies' },
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD' },
];

const formatMoney = (amount, currency) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const n = Number(amount);
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
};

const formatReadableDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const resolveImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  return `${base}${src.startsWith('/') ? src : `/${src}`}`;
};

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const PersonAvatar = ({ name, headshot }) => {
  const src = resolveImageUrl(headshot);
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Profile'}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200/80"
      />
    );
  }
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 ring-1 ring-gray-200/80"
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

/** Single status chip — one icon max (paid uses check; others use text-only style cues) */
const paymentStatusPill = (status) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Confirmed',
        className: 'bg-emerald-50 text-emerald-700',
        showCheck: true,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-rose-50 text-rose-700',
        showCheck: false,
      };
    case 'awaiting_verification':
      return {
        label: 'In review',
        className: 'bg-amber-50 text-amber-800',
        showCheck: false,
      };
    case 'awaiting_proof':
      return {
        label: 'Awaiting proof',
        className: 'bg-orange-50 text-orange-800',
        showCheck: false,
      };
    case 'expired':
      return {
        label: 'Expired',
        className: 'bg-gray-100 text-gray-600',
        showCheck: false,
      };
    default:
      return {
        label: (status || 'Unknown').replace(/_/g, ' '),
        className: 'bg-gray-100 text-gray-600',
        showCheck: false,
      };
  }
};

const labelForRole = (role) => {
  if (role === 'admin') {
    return {
      title: 'Payments',
      subtitle: 'Platform bookings, confirmations, rejections, and fee split.',
      listTitle: 'Recent payments & bookings',
      listSubtitle: 'A quick look at the latest bookings and payment decisions.',
      stats: [
        { key: 'primary', label: 'Platform earnings', icon: HiOutlineBanknotes, tone: 'text-emerald-600' },
        { key: 'secondary', label: 'Total booked', icon: HiOutlineChartBar, tone: 'text-sky-600' },
        { key: 'tertiary', label: 'Mentor share', icon: HiOutlineUsers, tone: 'text-violet-600' },
        { key: 'count', label: 'Paid bookings', icon: HiOutlineCurrencyDollar, tone: 'text-amber-600' },
      ],
    };
  }
  if (role === 'mentor') {
    return {
      title: 'Payments',
      subtitle: 'Your session payouts (80%) and booking payment status.',
      listTitle: 'Recent payments & bookings',
      listSubtitle: 'Payouts and payment status on your sessions.',
      stats: [
        { key: 'primary', label: 'Your earnings', icon: HiOutlineBanknotes, tone: 'text-emerald-600' },
        { key: 'secondary', label: 'Gross booked', icon: HiOutlineChartBar, tone: 'text-sky-600' },
        { key: 'tertiary', label: 'Platform fee', icon: HiOutlineCurrencyDollar, tone: 'text-rose-500' },
        { key: 'count', label: 'Paid sessions', icon: HiOutlineCheckBadge, tone: 'text-amber-600' },
      ],
    };
  }
  return {
    title: 'Payments',
    subtitle: 'What you paid, what’s due, and payment status on your bookings.',
    listTitle: 'Recent payments & bookings',
    listSubtitle: 'A quick look at your latest bookings and payments.',
    stats: [
      { key: 'primary', label: 'Total paid', icon: HiOutlineBanknotes, tone: 'text-emerald-600' },
      { key: 'secondary', label: 'Total booked', icon: HiOutlineChartBar, tone: 'text-sky-600' },
      { key: 'tertiary', label: 'Awaiting payment', icon: HiOutlineClock, tone: 'text-amber-600' },
      { key: 'count', label: 'Paid bookings', icon: HiOutlineCheckBadge, tone: 'text-violet-600' },
    ],
  };
};

const PAGE_SIZE = 10;

const emptyFilters = () => ({
  currency: 'all',
  from: '',
  to: '',
});

const matchesQuickStatus = (paymentStatus, quickStatus) => {
  if (!quickStatus || quickStatus === 'all') return true;
  if (quickStatus === 'paid') return paymentStatus === 'paid';
  if (quickStatus === 'rejected') return paymentStatus === 'rejected' || paymentStatus === 'failed';
  if (quickStatus === 'awaiting_verification') {
    return paymentStatus === 'awaiting_verification' || paymentStatus === 'awaiting_proof';
  }
  return paymentStatus === quickStatus;
};

/** Decorative card art for the payments hero — pure SVG, no assets */
const PaymentsBannerArt = () => (
  <svg
    viewBox="0 0 280 160"
    className="h-full w-full max-h-40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <ellipse cx="190" cy="118" rx="78" ry="18" fill="#86efac" opacity="0.35" />
    <path
      d="M40 108c28-22 56-18 84-6 30 12 58 8 86-10"
      stroke="#4ade80"
      strokeWidth="10"
      strokeLinecap="round"
      opacity="0.35"
    />
    <path
      d="M28 128c36-16 70-8 104 4 34 12 68 6 100-14"
      stroke="#22c55e"
      strokeWidth="8"
      strokeLinecap="round"
      opacity="0.25"
    />
    <g transform="translate(118 28) rotate(-18 70 44)">
      <rect x="0" y="0" width="140" height="88" rx="14" fill="#166534" />
      <rect x="10" y="10" width="120" height="68" rx="10" fill="#15803d" />
      <rect x="18" y="22" width="36" height="26" rx="5" fill="#86efac" opacity="0.9" />
      <circle cx="104" cy="34" r="10" fill="#bbf7d0" opacity="0.85" />
      <circle cx="118" cy="34" r="10" fill="#4ade80" opacity="0.75" />
      <rect x="18" y="58" width="52" height="8" rx="4" fill="#bbf7d0" opacity="0.7" />
      <rect x="78" y="58" width="34" height="8" rx="4" fill="#86efac" opacity="0.55" />
    </g>
    <g transform="translate(78 48) rotate(12 56 36)">
      <rect x="0" y="0" width="112" height="72" rx="12" fill="#22c55e" />
      <rect x="10" y="12" width="28" height="20" rx="4" fill="#dcfce7" />
      <rect x="10" y="44" width="40" height="7" rx="3.5" fill="#bbf7d0" opacity="0.85" />
      <rect x="58" y="44" width="28" height="7" rx="3.5" fill="#86efac" opacity="0.7" />
      <circle cx="86" cy="24" r="8" fill="#f0fdf4" opacity="0.9" />
    </g>
  </svg>
);

const PaymentsHeroBanner = ({ title, subtitle }) => (
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
        <HiOutlineWallet className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
        <p className="mt-1.5 text-sm sm:text-[15px] text-gray-600 max-w-xl leading-relaxed">
          {subtitle}
        </p>
      </div>
      <div className="hidden md:block w-52 lg:w-64 shrink-0 self-stretch">
        <PaymentsBannerArt />
      </div>
    </div>
  </section>
);

const STATUS_COLORS = {
  paid: '#059669',
  awaiting_verification: '#d97706',
  awaiting_proof: '#ea580c',
  rejected: '#e11d48',
  expired: '#9ca3af',
  failed: '#be123c',
  unknown: '#d1d5db',
};

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  fontSize: 12,
};

const StatusDonut = ({ breakdown = {} }) => {
  const segments = [
    { key: 'paid', name: 'Paid', value: breakdown.paid || 0 },
    { key: 'awaiting_verification', name: 'In review', value: breakdown.awaiting_verification || 0 },
    { key: 'awaiting_proof', name: 'Awaiting', value: breakdown.awaiting_proof || 0 },
    { key: 'rejected', name: 'Rejected', value: breakdown.rejected || 0 },
    { key: 'expired', name: 'Expired', value: breakdown.expired || 0 },
    { key: 'failed', name: 'Failed', value: breakdown.failed || 0 },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const data = segments.length ? segments : [{ key: 'empty', name: 'No data', value: 1 }];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={segments.length > 1 ? 2 : 0}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.key === 'empty' ? '#e5e7eb' : STATUS_COLORS[entry.key] || STATUS_COLORS.unknown}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={chartTooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Total</p>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {(segments.length ? segments : [{ key: 'empty', name: 'No data', value: 0 }]).map((seg) => (
          <li key={seg.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[seg.key] || STATUS_COLORS.unknown }}
              />
              <span className="text-gray-600 truncate">{seg.name}</span>
            </span>
            <span className="font-semibold tabular-nums text-gray-900">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SplitBars = ({ paidGross = 0, paidPlatformFees = 0, paidMentorPayouts = 0, currency, role }) => {
  const data =
    role === 'mentee'
      ? [{ name: 'Paid', amount: paidGross, fill: '#059669' }]
      : role === 'mentor'
        ? [
            { name: 'Payout', amount: paidMentorPayouts, fill: '#059669' },
            { name: 'Gross', amount: paidGross, fill: '#0ea5e9' },
            { name: 'Fee', amount: paidPlatformFees, fill: '#fb7185' },
          ]
        : [
            { name: 'Gross', amount: paidGross, fill: '#0ea5e9' },
            { name: 'Platform', amount: paidPlatformFees, fill: '#059669' },
            { name: 'Mentor', amount: paidMentorPayouts, fill: '#8b5cf6' },
          ];

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            width={48}
          />
          <Tooltip
            formatter={(value) => [formatMoney(value, currency), 'Amount']}
            contentStyle={chartTooltipStyle}
            cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
          />
          <Bar dataKey="amount" radius={[10, 10, 4, 4]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const VolumeAreaChart = ({ payments = [], currency }) => {
  const series = useMemo(() => {
    const buckets = new Map();
    // Money volume = paid only (rejected / pending contribute $0)
    payments.forEach((p) => {
      if (p.paymentStatus !== 'paid') return;
      const d = new Date(p.verifiedAt || p.createdAt || p.startTimeUTC);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const prev = buckets.get(key) || { date: key, gross: 0, platform: 0, mentor: 0 };
      prev.gross += Number(p.amount || 0);
      prev.platform += Number(p.platformFee || 0);
      prev.mentor += Number(p.mentorPayoutAmount || 0);
      buckets.set(key, prev);
    });
    return Array.from(buckets.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [payments]);

  const headline = series.reduce((sum, row) => sum + row.gross, 0);

  if (!series.length) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-gray-400">
        Not enough dated payments to chart volume yet.
      </div>
    );
  }

  return (
    <div>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900 mb-3">
        {formatMoney(headline, currency)}
      </p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="paymentsGrossFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => {
                const parts = String(v).split('-');
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : v;
              }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} width={44} />
            <Tooltip
              formatter={(value, name) => [
                formatMoney(value, currency),
                name === 'gross' ? 'Gross' : name === 'platform' ? 'Platform' : 'Mentor',
              ]}
              labelFormatter={(label) => label}
              contentStyle={chartTooltipStyle}
            />
            <Area
              type="monotone"
              dataKey="gross"
              stroke="#059669"
              strokeWidth={2.5}
              fill="url(#paymentsGrossFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#059669' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PaymentRow = ({ item, role }) => {
  const status = paymentStatusPill(item.paymentStatus);

  // Avatar = the "other" person for mentor/mentee; mentee for admin (primary actor)
  const avatarPerson =
    role === 'mentee'
      ? { name: item.mentor?.name || 'Mentor', headshot: item.mentor?.headshot }
      : { name: item.mentee?.name || 'Mentee', headshot: item.mentee?.headshot };

  const primaryName =
    role === 'mentor'
      ? item.mentee?.name || 'Mentee'
      : item.mentee?.name || 'Mentee';
  const secondaryName =
    role === 'mentee'
      ? item.mentor?.name || 'Mentor'
      : item.mentor?.name || 'Mentor';

  const focusAmount =
    role === 'mentor' && item.paymentStatus === 'paid'
      ? formatMoney(item.mentorPayoutAmount, item.currency)
      : formatMoney(item.amount, item.currency);

  return (
    <li>
      <div className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-gray-50 px-3 sm:px-4 py-3.5 transition-colors hover:bg-gray-100/80">
        <PersonAvatar name={avatarPerson.name} headshot={avatarPerson.headshot} />

        <div className="min-w-0 flex-1">
          {role === 'admin' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="truncate text-[15px] sm:text-base font-semibold tracking-tight text-gray-900">
                {primaryName}
              </p>
              <HiOutlineArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" strokeWidth={2} />
              <p className="truncate text-[15px] sm:text-base font-medium tracking-tight text-gray-500">
                {secondaryName}
              </p>
            </div>
          ) : role === 'mentor' ? (
            <p className="truncate text-[15px] sm:text-base font-semibold tracking-tight text-gray-900">
              {primaryName}
            </p>
          ) : (
            <p className="truncate text-[15px] sm:text-base font-semibold tracking-tight text-gray-900">
              Session with {secondaryName}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <HiOutlineCalendarDays className="h-3.5 w-3.5 text-gray-400" />
              <span className="tabular-nums">{formatReadableDate(item.startTimeUTC)}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}
            >
              {status.showCheck && (
                <HiOutlineCheckCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
              )}
              {status.label}
            </span>

            {item.parentMegaSession && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                Mega
              </span>
            )}
          </div>

        </div>

        <div className="shrink-0 text-right min-w-[6.5rem] sm:min-w-[7.5rem]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Total amount
          </p>
          <p className="mt-0.5 text-[22px] sm:text-2xl font-bold tabular-nums tracking-tight text-gray-900 leading-none">
            {focusAmount}
          </p>
          {role !== 'mentee' ? (
            <p className="mt-1.5 text-xs tabular-nums text-gray-400">
              Fee {formatMoney(item.platformFee, item.currency)}
              <span className="mx-1 text-gray-300">·</span>
              Mentor {formatMoney(item.mentorPayoutAmount, item.currency)}
            </p>
          ) : (
            <p className="mt-1.5 text-xs capitalize text-gray-400">{item.bookingStatus}</p>
          )}
        </div>

        {(role === 'admin' || item.proofImageUrl) && (
          <div className="shrink-0">
            {item.proofImageUrl ? (
              <a
                href={item.proofImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View payment receipt"
                title="View payment receipt"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                <HiOutlineDocumentText className="h-5 w-5" strokeWidth={1.6} />
              </a>
            ) : role === 'admin' ? (
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-300"
                title="No receipt attached"
                aria-hidden="true"
              >
                <HiOutlineDocumentText className="h-5 w-5" strokeWidth={1.6} />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </li>
  );
};

const DashboardPaymentsTab = ({ role }) => {
  const copy = useMemo(() => labelForRole(role), [role]);
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Server: date/currency only. Status pills + row paging are client-side.
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        paymentStatus: 'all',
        currency: applied.currency,
        page: 1,
        limit: 1000,
      };
      if (applied.from) params.from = applied.from;
      if (applied.to) params.to = applied.to;

      const response = await bookingService.getPaymentHistory(params);
      setData(response);
      setPage(1);
    } catch (err) {
      setError(err.message || 'Failed to load payment history');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const setQuickStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleApply = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied({ ...filters });
  };

  const handleReset = () => {
    const cleared = emptyFilters();
    setFilters(cleared);
    setApplied(cleared);
    setStatusFilter('all');
    setPage(1);
  };

  const allPayments = data?.payments || [];

  const filteredPayments = useMemo(
    () => allPayments.filter((p) => matchesQuickStatus(p.paymentStatus, statusFilter)),
    [allPayments, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPayments = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, safePage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const totalsByCurrency = data?.totals || [];
  const primaryTotal = totalsByCurrency[0];
  const breakdown = data?.paymentStatusBreakdown || {};

  const statValue = (key) => {
    if (!primaryTotal) {
      if (key === 'count' || key === 'tertiary') return '0';
      return '0';
    }
    if (key === 'count') return String(primaryTotal.paidCount ?? 0);
    if (key === 'primary') {
      if (role === 'admin') return formatMoney(primaryTotal.paidPlatformFees, primaryTotal.currency);
      if (role === 'mentor') return formatMoney(primaryTotal.paidMentorPayouts, primaryTotal.currency);
      return formatMoney(primaryTotal.paidGross, primaryTotal.currency);
    }
    // Gross / total booked = paid money only (rejected / pending add $0)
    if (key === 'secondary') {
      return formatMoney(
        primaryTotal.paidGross ?? primaryTotal.grossBooked,
        primaryTotal.currency
      );
    }
    if (key === 'tertiary') {
      if (role === 'admin') return formatMoney(primaryTotal.paidMentorPayouts, primaryTotal.currency);
      if (role === 'mentor') return formatMoney(primaryTotal.paidPlatformFees, primaryTotal.currency);
      return String(
        (primaryTotal.awaitingProofCount || 0) + (primaryTotal.awaitingVerificationCount || 0)
      );
    }
    return '—';
  };

  return (
    <div className="space-y-6">
      <PaymentsHeroBanner title={copy.title} subtitle={copy.subtitle} />

      <form
        onSubmit={handleApply}
        className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider inline-flex items-center gap-1.5">
              <HiOutlineGlobeAlt className="h-3.5 w-3.5 text-gray-400" />
              Currency
            </span>
            <select
              value={filters.currency}
              onChange={(e) => setFilters((f) => ({ ...f, currency: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider inline-flex items-center gap-1.5">
              <HiOutlineCalendarDays className="h-3.5 w-3.5 text-gray-400" />
              From
            </span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider inline-flex items-center gap-1.5">
              <HiOutlineCalendarDays className="h-3.5 w-3.5 text-gray-400" />
              To
            </span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-6 w-6 rounded bg-gray-100 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {copy.stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <Icon className={`h-6 w-6 ${stat.tone}`} strokeWidth={1.5} />
                  <p className="mt-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                    {statValue(stat.key)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <section className="xl:col-span-3 rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-gray-900 tracking-tight">Payment volume</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Paid gross only (by confirm/book date). Rejected attempts are excluded.
                </p>
              </div>
              <VolumeAreaChart
                payments={data?.payments || []}
                currency={primaryTotal?.currency}
              />
            </section>
            <section className="xl:col-span-2 rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6">
              <div className="mb-5">
                <h3 className="text-base font-semibold text-gray-900 tracking-tight">Payment mix</h3>
                <p className="mt-1 text-sm text-gray-500">Status breakdown for the current filters.</p>
              </div>
              <StatusDonut breakdown={breakdown} />
            </section>
          </div>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                {role === 'mentee' ? 'Spending' : 'Fee split'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Paid amounts in {primaryTotal?.currency || 'selected currency'}.
              </p>
            </div>
            <SplitBars
              role={role}
              currency={primaryTotal?.currency}
              paidGross={primaryTotal?.paidGross || 0}
              paidPlatformFees={primaryTotal?.paidPlatformFees || 0}
              paidMentorPayouts={primaryTotal?.paidMentorPayouts || 0}
            />
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <HiOutlineCalendarDays className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                    {copy.listTitle}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">{copy.listSubtitle}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full bg-gray-100 p-1">
                  {QUICK_STATUS_FILTERS.map((opt) => {
                    const active = statusFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQuickStatus(opt.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 tabular-nums sm:ml-1">
                  {filteredPayments.length} total
                </p>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <p className="py-12 text-sm text-gray-500 text-center">
                No payments match these filters.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {pagedPayments.map((item) => (
                  <PaymentRow key={item.id} item={item} role={role} />
                ))}
              </ul>
            )}

            {filteredPayments.length > PAGE_SIZE && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
                >
                  Previous
                </button>
                <p className="text-xs text-gray-400 tabular-nums">
                  Page {safePage} of {totalPages}
                </p>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPaymentsTab;
