import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { openWhatsAppFromResponse } from '../lib/openWhatsApp.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

function daysSince(date) {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export default function ComebackPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sending, setSending] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/customers');
        setList(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Could not load customers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(qq) ||
        String(c.phone || '').toLowerCase().includes(qq)
    );
  }, [list, q]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ta = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
      const tb = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
      return ta - tb;
    });
  }, [filtered]);

  async function bringBack(customerId) {
    setSending((s) => ({ ...s, [customerId]: true }));
    try {
      const { data: res } = await api.post('/whatsapp/send', {
        customerId,
        template: 'comeback',
      });
      if (openWhatsAppFromResponse(res)) {
        toast.success('Opening WhatsApp with your comeback template…', { duration: 4000 });
      } else {
        toast.success('Message ready');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Send failed');
    } finally {
      setSending((s) => ({ ...s, [customerId]: false }));
    }
  }

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
          Bring back customers
        </h1>
        <p className="mt-1 text-theme-muted">
          Every customer is listed here. Use <strong className="text-slate-800 dark:text-slate-300">Bring back</strong>{' '}
          to open WhatsApp (wa.me) with your comeback template — edit it under{' '}
          <strong className="text-slate-800 dark:text-slate-300">WhatsApp</strong> in the sidebar.
        </p>
      </div>

      <ListSearchBar
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or phone"
      />

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-theme bg-theme-elevated text-xs uppercase tracking-wide text-theme-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Last visit</th>
                <th className="px-4 py-3 font-medium">Days ago</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-theme-subtle">
                    {list.length === 0
                      ? 'No customers yet. Add customers from the Customers page.'
                      : 'No customers match your search.'}
                  </td>
                </tr>
              ) : (
                sorted.map((c) => {
                  const d = daysSince(c.lastVisit);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                      <td className="px-4 py-3 text-theme-muted">{c.phone}</td>
                      <td className="px-4 py-3 text-theme-muted">
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-theme-muted">{d != null ? `${d}d` : '—'}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{c.totalVisits ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            disabled={sending[c._id]}
                            onClick={() => bringBack(c._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Bring back
                          </button>
                          <Link
                            to={`/customers/${c._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
