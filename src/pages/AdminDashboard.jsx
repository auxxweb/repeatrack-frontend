import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Building2, Plus, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../lib/api.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [bizQ, setBizQ] = useState('');
  const [bizStatus, setBizStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([api.get('/admin/business/analytics'), api.get('/admin/business')]);
        setAnalytics(a.data);
        setBusinesses(Array.isArray(b.data) ? b.data : []);
      } catch {
        toast.error('Could not load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const barData = useMemo(() => {
    const t = analytics?.totalBusinesses ?? 0;
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return labels.map((name, i) => {
      const phase = (i + 1) / 6;
      const jitter = i % 3 === 0 ? 0 : 1;
      return {
        name,
        value: Math.max(0, Math.round(t * phase * 0.85 + jitter)),
      };
    });
  }, [analytics]);

  const sparkData = useMemo(() => {
    const t = analytics?.totalBusinesses ?? 0;
    return Array.from({ length: 12 }, (_, i) => ({
      x: i,
      y: Math.max(0, Math.round((t * (i + 1)) / 12 + (i % 2))),
    }));
  }, [analytics]);

  const maxBarIdx = useMemo(() => {
    let best = 0;
    barData.forEach((d, i) => {
      if (d.value >= barData[best].value) best = i;
    });
    return best;
  }, [barData]);

  const filteredRecentBusinesses = useMemo(() => {
    let list = businesses;
    if (bizStatus === 'active') list = list.filter((r) => r.status === 'active');
    if (bizStatus === 'blocked') list = list.filter((r) => r.status !== 'active');
    const qq = bizQ.trim().toLowerCase();
    if (qq) {
      list = list.filter((r) => {
        const email = String(r.owner?.email || '').toLowerCase();
        return (
          (r.name || '').toLowerCase().includes(qq) ||
          email.includes(qq) ||
          String(r.plan || '').toLowerCase().includes(qq)
        );
      });
    }
    return list.slice(0, 25);
  }, [businesses, bizQ, bizStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const active = analytics?.activeBusinesses ?? 0;
  const owners = analytics?.totalBusinessUsers ?? 0;
  const total = analytics?.totalBusinesses ?? 0;

  return (
    <div className="font-admin space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform health and tenant overview — RepeaTrack console.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-admin-secondary !rounded-full p-2.5 text-slate-700 dark:text-slate-200"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link to="/admin/businesses" className="btn-admin-primary shadow-lg shadow-zinc-900/10">
            <Plus className="h-4 w-4" />
            New business
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-white shadow-xl ring-1 ring-white/10">
          <p className="text-sm font-medium text-zinc-400">Total businesses</p>
          <p className="mt-2 font-admin text-4xl font-bold tracking-tight">{total}</p>
          <p className="mt-1 text-xs text-emerald-400/90">Registered on the platform</p>
          <div className="mt-4 h-[72px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active businesses</p>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Live
              </span>
            </div>
            <p className="mt-3 font-admin text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {active}
            </p>
            <p className="mt-2 text-xs text-slate-500">Tenants currently accepting customers</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Operational storefronts
          </div>
        </div>

        <div className="admin-card flex flex-col justify-between p-6">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Owner accounts</p>
            <p className="mt-3 font-admin text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {owners}
            </p>
            <p className="mt-2 text-xs text-slate-500">Business user logins issued</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-4 w-4" />
            Includes all roles under Business
          </div>
        </div>
      </div>

      <div className="admin-card p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">
              Tenant growth
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Six-month snapshot (synthetic ramp)</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Last 6 months
          </span>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(148,163,184,0.2)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {barData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={index === maxBarIdx ? '#15803d' : '#22c55e'}
                    opacity={0.85 + index * 0.02}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="admin-card overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-white/10">
            <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">
              Recent businesses
            </h2>
            <p className="text-sm text-slate-500">Search and filter tenants (up to 25 shown)</p>
          </div>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-end">
            <ListSearchBar
              className="max-w-full sm:max-w-md sm:flex-1"
              value={bizQ}
              onChange={(e) => setBizQ(e.target.value)}
              placeholder="Search name, owner email, plan…"
            />
            <div className="flex flex-col gap-1.5 sm:min-w-[140px]">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="admin-dash-biz-status">
                Status
              </label>
              <select
                id="admin-dash-biz-status"
                className="input-field !rounded-2xl text-sm"
                value={bizStatus}
                onChange={(e) => setBizStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-6 py-3">Business</th>
                  <th className="px-6 py-3">Owner email</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {businesses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No businesses yet — create one to get started.
                    </td>
                  </tr>
                ) : filteredRecentBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No businesses match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecentBusinesses.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.owner?.email ?? '—'}</td>
                      <td className="px-6 py-4 capitalize text-slate-700 dark:text-slate-300">{r.plan}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            r.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'
                          }`}
                        >
                          {r.status === 'active' ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="admin-card flex flex-1 flex-col justify-between bg-gradient-to-br from-emerald-50/90 to-white p-6 dark:from-emerald-950/40 dark:to-slate-900/90">
            <div>
              <p className="text-sm font-medium text-emerald-900/80 dark:text-emerald-300/90">Operations</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {total} tenants
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Create businesses and owner logins from the Businesses page. Each owner only sees their own
                data.
              </p>
            </div>
            <Link
              to="/admin/businesses"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-emerald-600/20 bg-emerald-600/10 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-600/15 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
            >
              Open businesses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
