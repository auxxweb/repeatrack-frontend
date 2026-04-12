import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IndianRupee, Users, Calendar, UserX, Footprints, Repeat } from 'lucide-react';
import api from '../lib/api.js';
import { formatINR } from '../lib/formatCurrency.js';
import StatCard from '../components/StatCard.jsx';
import ListSearchBar from '../components/ListSearchBar.jsx';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [helpQ, setHelpQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/reports/summary');
        setSummary(data);
      } catch {
        toast.error('Could not load reports');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const howLines = useMemo(
    () => [
      'All monetary values are in Indian Rupees (INR, ₹).',
      'Revenue sums final bill amounts from all recorded visits.',
      "Today's revenue uses visits recorded today (server midnight in UTC — align TZ in production).",
      `Inactive matches the Comeback rule (no visit in ${summary?.inactiveRuleDays ?? 25}+ days).`,
      'Repeat vs new uses lifetime visit counts on each customer profile.',
    ],
    [summary?.inactiveRuleDays]
  );

  const filteredHowLines = useMemo(() => {
    const qq = helpQ.trim().toLowerCase();
    if (!qq) return howLines;
    return howLines.filter((line) => line.toLowerCase().includes(qq));
  }, [howLines, helpQ]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-theme-muted">Key metrics for your storefront.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total customers" value={summary?.totalCustomers ?? '—'} icon={Users} />
        <StatCard title="Total visits (all time)" value={summary?.totalVisits ?? '—'} icon={Footprints} />
        <StatCard title="Visits today" value={summary?.todayVisits ?? '—'} icon={Calendar} />
        <StatCard title="Today's revenue" value={formatINR(summary?.todayRevenue)} icon={IndianRupee} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="All-time revenue" value={formatINR(summary?.revenue)} icon={IndianRupee} />
        <StatCard
          title="Inactive customers"
          value={summary?.inactiveCount ?? '—'}
          hint={`No visit in ${summary?.inactiveRuleDays ?? 25}+ days`}
          icon={UserX}
        />
        <StatCard
          title="Repeat customers"
          value={summary?.repeatCustomers ?? '—'}
          hint="2+ lifetime visits"
          icon={Repeat}
        />
        <StatCard
          title="New (single visit)"
          value={summary?.newCustomers ?? '—'}
          hint="Exactly one visit so far"
          icon={Users}
        />
      </div>

      <div className="glass-panel p-6">
        <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">How we count</h2>
        <p className="mt-1 text-sm text-theme-subtle">Definitions behind the numbers — use search to jump to a topic.</p>
        <div className="mt-4">
          <ListSearchBar
            value={helpQ}
            onChange={(e) => setHelpQ(e.target.value)}
            placeholder="Search definitions (e.g. revenue, inactive, repeat)…"
          />
        </div>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-theme-muted">
          {filteredHowLines.length === 0 ? (
            <li className="list-none text-theme-subtle">No definitions match your search.</li>
          ) : (
            filteredHowLines.map((line) => <li key={line}>{line}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}
