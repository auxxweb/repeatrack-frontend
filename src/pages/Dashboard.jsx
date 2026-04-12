import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  TrendingDown,
  IndianRupee,
  ArrowRight,
  Link2,
  Footprints,
  UserPlus,
  CalendarPlus,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../lib/api.js';
import { formatINR } from '../lib/formatCurrency.js';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ListSearchBar from '../components/ListSearchBar.jsx';

const PIE_COLORS = ['#059669', '#34d399', '#94a3b8'];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [dailySeries, setDailySeries] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [inactiveQ, setInactiveQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, inc, daily] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/customers/inactive'),
          api.get('/reports/daily?days=14'),
        ]);
        if (!cancelled) {
          setSummary(s.data);
          setInactiveCustomers(Array.isArray(inc.data.customers) ? inc.data.customers : []);
          setDailySeries(Array.isArray(daily.data.series) ? daily.data.series : []);
        }
      } catch {
        if (!cancelled) toast.error('Could not load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const inactiveFiltered = useMemo(() => {
    const qq = inactiveQ.trim().toLowerCase();
    const list = inactiveCustomers;
    if (!qq) return list.slice(0, 8);
    return list
      .filter(
        (c) =>
          (c.name || '').toLowerCase().includes(qq) ||
          String(c.phone || '').toLowerCase().includes(qq)
      )
      .slice(0, 12);
  }, [inactiveCustomers, inactiveQ]);

  const customerMix = useMemo(() => {
    if (!summary) return [];
    const total = summary.totalCustomers ?? 0;
    const repeat = summary.repeatCustomers ?? 0;
    const oneVisit = summary.newCustomers ?? 0;
    const noVisitsYet = Math.max(0, total - repeat - oneVisit);
    const rows = [
      { name: 'Repeat (2+ visits)', value: repeat },
      { name: 'Single visit', value: oneVisit },
      { name: 'No visits yet', value: noVisitsYet },
    ].filter((r) => r.value > 0);
    return rows.length ? rows : [{ name: 'No customers', value: 1 }];
  }, [summary]);

  const chartTooltipStyle = {
    borderRadius: 12,
    border: '1px solid rgb(226 232 240)',
    boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-theme-muted">Overview, charts, and shortcuts for your storefront.</p>
      </div>

      <div className="glass-panel p-4 sm:p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-theme-subtle">Quick actions</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            to="/visits"
            className="btn-primary inline-flex items-center gap-2 py-2.5 text-sm sm:min-h-[44px]"
          >
            <Footprints className="h-4 w-4 shrink-0" />
            Log walk-in visit
          </Link>
          <Link
            to="/customers"
            className="btn-ghost inline-flex items-center gap-2 border border-slate-200 py-2.5 text-sm sm:min-h-[44px] dark:border-white/10"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            Add customer
          </Link>
          <Link
            to="/bookings"
            className="btn-ghost inline-flex items-center gap-2 border border-slate-200 py-2.5 text-sm sm:min-h-[44px] dark:border-white/10"
          >
            <CalendarPlus className="h-4 w-4 shrink-0" />
            New booking
          </Link>
          <Link
            to="/comebackpage"
            className="btn-ghost inline-flex items-center gap-2 border border-slate-200 py-2.5 text-sm sm:min-h-[44px] dark:border-white/10"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Bring back (WhatsApp)
          </Link>
          <Link
            to="/reports"
            className="btn-ghost inline-flex items-center gap-2 border border-slate-200 py-2.5 text-sm sm:min-h-[44px] dark:border-white/10"
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            Full reports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total customers" value={summary?.totalCustomers ?? '—'} icon={Users} />
        <StatCard title="Total visits" value={summary?.totalVisits ?? '—'} icon={Calendar} />
        <StatCard title="Visits today" value={summary?.todayVisits ?? '—'} icon={Calendar} />
        <StatCard title="Today's revenue" value={formatINR(summary?.todayRevenue)} icon={IndianRupee} />
        <StatCard
          title="Inactive (risk)"
          value={summary?.inactiveCount ?? '—'}
          hint={`No visit in ${summary?.inactiveRuleDays ?? 25}+ days`}
          icon={TrendingDown}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="All-time revenue" value={formatINR(summary?.revenue)} icon={IndianRupee} />
        <StatCard
          title="Repeat customers"
          value={summary?.repeatCustomers ?? '—'}
          hint="2+ lifetime visits"
          icon={Users}
        />
        <StatCard
          title="Single-visit customers"
          value={summary?.newCustomers ?? '—'}
          hint="Exactly one visit so far"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-5 sm:p-6">
          <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Visits per day</h2>
          <p className="mt-1 text-sm text-theme-subtle">Last 14 days</p>
          <div className="mt-4 h-[260px] w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.35)" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v) => [v, 'Visits']}
                  labelFormatter={(_, p) => (p?.[0]?.payload?.date ? String(p[0].payload.date) : '')}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#059669' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 sm:p-6">
          <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Revenue per day</h2>
          <p className="mt-1 text-sm text-theme-subtle">Last 14 days (₹)</p>
          <div className="mt-4 h-[260px] w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.35)" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v) => [formatINR(v), 'Revenue']}
                  labelFormatter={(_, p) => (p?.[0]?.payload?.date ? String(p[0].payload.date) : '')}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Customer mix</h2>
              <p className="mt-1 text-sm text-theme-subtle">Split by lifetime visit count</p>
            </div>
            <div className="mx-auto h-[260px] w-full max-w-md min-h-[220px] lg:mx-0 lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerMix}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {customerMix.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(v, n, p) => [v, p?.payload?.name ?? '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-admin text-lg font-semibold">Customers you may be losing</h2>
              <p className="text-sm text-theme-subtle">Inactive {summary?.inactiveRuleDays ?? 25}+ days</p>
            </div>
            <Link
              to="/comebackpage"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Open bring back <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {inactiveCustomers.length > 0 && (
            <div className="mb-4">
              <ListSearchBar
                className="max-w-full"
                value={inactiveQ}
                onChange={(e) => setInactiveQ(e.target.value)}
                placeholder="Search at-risk customers…"
              />
            </div>
          )}
          {inactiveCustomers.length === 0 ? (
            <p className="text-sm text-theme-subtle">No inactive customers — great job.</p>
          ) : inactiveFiltered.length === 0 ? (
            <p className="text-sm text-theme-subtle">No matches — try another search or open Bring back.</p>
          ) : (
            <ul className="max-h-64 divide-y divide-theme overflow-y-auto pr-1">
              {inactiveFiltered.map((c) => (
                <li key={c._id} className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-theme-subtle">{c.phone}</p>
                  </div>
                  <Link to="/comebackpage" className="btn-ghost py-1.5 text-xs">
                    Act
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel p-6">
          <h2 className="mb-2 font-admin text-lg font-semibold">Public booking page</h2>
          <p className="mb-3 text-sm text-theme-subtle">
            Share this link with customers — they can request a time without logging in.
          </p>
          {user?.business?.bookingSlug && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="code-inline block flex-1 truncate px-3 py-2">
                {`${window.location.origin}/book/${user.business.bookingSlug}`}
              </code>
              <button
                type="button"
                className="btn-ghost shrink-0 py-2 text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/book/${user.business.bookingSlug}`
                  );
                  toast.success('Link copied');
                }}
              >
                <Link2 className="h-4 w-4" />
                Copy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
