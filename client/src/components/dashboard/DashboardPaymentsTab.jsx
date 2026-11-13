import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineUsers,
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

const bookingTypeVisual = (item) => {
  if (item.parentMegaSession) {
    return {
      Icon: HiOutlineSparkles,
      tile: 'bg-violet-50 text-violet-600',
    };
  }
  if (item.paymentStatus === 'paid') {
    return {
      Icon: HiOutlineCheckBadge,
      tile: 'bg-emerald-50 text-emerald-600',
    };
  }
  if (item.paymentStatus === 'rejected' || item.paymentStatus === 'expired') {
    return {
      Icon: HiOutlineExclamationCircle,
      tile: 'bg-rose-50 text-rose-600',
    };
  }
  if (item.paymentStatus === 'awaiting_verification' || item.paymentStatus === 'awaiting_proof') {
    return {
      Icon: HiOutlineClock,
      tile: 'bg-amber-50 text-amber-700',
    };
  }
  return {
    Icon: HiOutlineAcademicCap,
    tile: 'bg-sky-50 text-sky-600',
  };
};

const paymentStatusPill = (status) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Confirmed',
        className: 'bg-emerald-50 text-emerald-700',
        Icon: HiOutlineCheckCircle,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: 'bg-rose-50 text-rose-700',
        Icon: HiOutlineExclamationCircle,
      };
    case 'awaiting_verification':
      return {
        label: 'In review',
        className: 'bg-amber-50 text-amber-800',
        Icon: HiOutlineClock,
      };
    case 'awaiting_proof':
      return {
        label: 'Awaiting proof',
        className: 'bg-orange-50 text-orange-800',
        Icon: HiOutlinePhoto,
      };
    case 'expired':
      return {
        label: 'Expired',
        className: 'bg-gray-100 text-gray-600',
        Icon: HiOutlineExclamationCircle,
      };
    default:
      return {
        label: (status || 'Unknown').replace(/_/g, ' '),
        className: 'bg-gray-100 text-gray-600',
        Icon: HiOutlineExclamationCircle,
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

const emptyFilters = () => ({
  paymentStatus: 'all',
  currency: 'all',
  from: '',
  to: '',
});

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
    payments.forEach((p) => {
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
  const type = bookingTypeVisual(item);
  const TypeIcon = type.Icon;
  const status = paymentStatusPill(item.paymentStatus);
  const StatusIcon = status.Icon;
  const highlighted = item.paymentStatus === 'paid';

  const primaryName =
    role === 'mentor'
      ? item.mentee?.name || 'Mentee'
      : item.mentee?.name || 'Mentee';
  const secondaryName =
    role === 'mentee'
      ? item.mentor?.name || 'Mentor'
      : item.mentor?.name || 'Mentor';

  const grossLabel = formatMoney(item.amount, item.currency);
  const focusAmount =
    role === 'mentor' && item.paymentStatus === 'paid'
      ? formatMoney(item.mentorPayoutAmount, item.currency)
      : grossLabel;

  return (
    <li>
      <div className="relative flex items-center gap-3 sm:gap-4 rounded-2xl bg-gray-50 px-3 sm:px-4 py-3.5 transition-colors hover:bg-gray-100/80">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${type.tile}`}
        >
          <TypeIcon className="h-5 w-5" strokeWidth={1.7} />
        </div>

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
            <div className="min-w-0">
              <p className="truncate text-[15px] sm:text-base font-semibold tracking-tight text-gray-900">
                Session with {secondaryName}
              </p>
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <HiOutlineCalendarDays className="h-3.5 w-3.5 text-gray-400" />
              <span className="tabular-nums">{formatReadableDate(item.startTimeUTC)}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {status.label}
            </span>

            {item.verifiedAt && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <HiOutlineClock className="h-3.5 w-3.5" />
                Confirmed {formatReadableDate(item.verifiedAt)}
              </span>
            )}

            {item.parentMegaSession && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                <HiOutlineSparkles className="h-3 w-3" />
                Mega
              </span>
            )}
          </div>

          {item.paymentStatus === 'rejected' && item.rejectionReason && (
            <p className="mt-1 text-xs text-rose-600 truncate max-w-xl">{item.rejectionReason}</p>
          )}
        </div>

        {highlighted && (
          <HiOutlineCheckCircle
            className="hidden md:block h-7 w-7 shrink-0 text-emerald-500"
            strokeWidth={1.5}
          />
        )}

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
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        paymentStatus: applied.paymentStatus,
        currency: applied.currency,
        page,
        limit: 20,
      };
      if (applied.from) params.from = applied.from;
      if (applied.to) params.to = applied.to;

      const response = await bookingService.getPaymentHistory(params);
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to load payment history');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const setQuickStatus = (value) => {
    setFilters((f) => ({ ...f, paymentStatus: value }));
    setApplied((f) => ({ ...f, paymentStatus: value }));
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
    setPage(1);
  };

  const totalsByCurrency = data?.totals || [];
  const primaryTotal = totalsByCurrency[0];
  const pagination = data?.pagination;
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
    if (key === 'secondary') return formatMoney(primaryTotal.grossBooked, primaryTotal.currency);
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
      <section className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{copy.title}</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-2xl leading-relaxed">{copy.subtitle}</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleApply}
        className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</span>
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
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">From</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">To</span>
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
              <div className="h-10 w-10 rounded-xl bg-gray-100 mb-4" />
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
                  className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5"
                >
                  <Icon className={`h-6 w-6 ${stat.tone}`} strokeWidth={1.6} />
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
                  Gross from recent rows in this view (by confirm/book date).
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
                    const active = applied.paymentStatus === opt.value;
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
                  {pagination?.total ?? 0} total
                </p>
              </div>
            </div>

            {(data?.payments || []).length === 0 ? (
              <p className="py-12 text-sm text-gray-500 text-center">
                No payments match these filters.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {data.payments.map((item) => (
                  <PaymentRow key={item.id} item={item} role={role} />
                ))}
              </ul>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
                >
                  Previous
                </button>
                <p className="text-xs text-gray-400 tabular-nums">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
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
