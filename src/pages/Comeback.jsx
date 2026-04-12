import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { openWhatsAppFromResponse } from '../lib/openWhatsApp.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

export default function Comeback() {
  const [data, setData] = useState({ inactiveDays: 25, customers: [] });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get('/customers/inactive');
        setData(d);
      } catch {
        toast.error('Could not load inactive customers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function sendWhatsApp(customerId, template) {
    setSending((s) => ({ ...s, [customerId]: true }));
    try {
      const { data: res } = await api.post('/whatsapp/send', { customerId, template });
      if (openWhatsAppFromResponse(res)) {
        toast.success('Opening WhatsApp with your template…', { duration: 4000 });
      } else {
        toast.success('Message ready');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed');
    } finally {
      setSending((s) => ({ ...s, [customerId]: false }));
    }
  }

  const filteredCustomers = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return data.customers;
    return data.customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(qq) ||
        String(c.phone || '').toLowerCase().includes(qq)
    );
  }, [data.customers, q]);

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
          Comeback dashboard
        </h1>
        <p className="mt-1 text-theme-muted">
          Customers with no visit in over {data.inactiveDays} days — win them back with WhatsApp.
        </p>
      </div>

      <ListSearchBar
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search inactive customers by name or phone"
      />

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-theme bg-theme-elevated text-xs uppercase tracking-wide text-theme-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Last visit</th>
                <th className="px-4 py-3 font-medium">Days inactive</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium text-right">Quick actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {data.customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-theme-subtle">
                    No inactive customers right now.
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-theme-subtle">
                    No customers match your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                    <td className="px-4 py-3 text-theme-muted">{c.phone}</td>
                    <td className="px-4 py-3 text-theme-muted">
                      {c.lastVisit
                        ? new Date(c.lastVisit).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-amber-700 dark:text-amber-200/90">
                      {c.daysInactive != null ? `${c.daysInactive}d` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{c.loyaltyPoints ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={sending[c._id]}
                          onClick={() => sendWhatsApp(c._id, 'comeback')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-500/25 disabled:opacity-50 dark:text-emerald-300"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Comeback
                        </button>
                        <button
                          type="button"
                          disabled={sending[c._id]}
                          onClick={() => sendWhatsApp(c._id, 'reminder')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                        >
                          Reminder
                        </button>
                        <button
                          type="button"
                          disabled={sending[c._id]}
                          onClick={() => sendWhatsApp(c._id, 'missed')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-500/25 disabled:opacity-50 dark:text-amber-200"
                        >
                          Missed
                        </button>
                        <Link
                          to={`/customers/${c._id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
