import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import api from '../lib/api.js';
import { formatINR } from '../lib/formatCurrency.js';
import { openWhatsAppFromResponse } from '../lib/openWhatsApp.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [visitQ, setVisitQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get(`/customers/${id}`);
        if (!cancelled) setData(d);
      } catch {
        toast.error('Customer not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function sendTemplate(template, extra = {}) {
    setSending(true);
    try {
      const { data: res } = await api.post('/whatsapp/send', {
        customerId: id,
        template,
        ...extra,
      });
      if (openWhatsAppFromResponse(res)) {
        toast.success('Opening WhatsApp…', { duration: 3500 });
      } else {
        toast.success('Ready');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSending(false);
    }
  }

  const visits = data?.visits;

  const filteredVisits = useMemo(() => {
    if (!visits?.length) return visits || [];
    const qq = visitQ.trim().toLowerCase();
    if (!qq) return visits;
    return visits.filter((v) => {
      const when = new Date(v.date || v.visitedAt).toLocaleString().toLowerCase();
      const servicesStr = (v.services || [])
        .map((s) => `${s.name || ''} ${s.quantity || ''}`)
        .join(' ')
        .toLowerCase();
      const amt = formatINR(v.finalAmount).toLowerCase();
      return when.includes(qq) || servicesStr.includes(qq) || amt.includes(qq);
    });
  }, [visits, visitQ]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const { customer } = data;
  const nextTier = 500;
  const progress = Math.min(100, ((customer.loyaltyPoints || 0) / nextTier) * 100);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/customers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-theme-muted hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Customers
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {customer.name}
            </h1>
            <p className="mt-1 text-theme-muted">{customer.phone}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={() => sendTemplate('comeback')}
              className="btn-primary py-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp comeback
            </button>
            <button type="button" disabled={sending} onClick={() => sendTemplate('reminder')} className="btn-ghost py-2 text-sm">
              Reminder
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total visits', customer.totalVisits],
          ['Total spent', formatINR(customer.totalSpent || 0)],
          ['Loyalty points', customer.loyaltyPoints ?? 0],
          [
            'Last visit',
            customer.lastVisit ? new Date(customer.lastVisit).toLocaleString() : '—',
          ],
        ].map(([k, v]) => (
          <div key={k} className="glass-panel p-4">
            <p className="text-xs uppercase tracking-wide text-theme-subtle">{k}</p>
            <p className="mt-1 font-admin text-xl font-semibold text-slate-900 dark:text-white">{v}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-5">
        <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Loyalty progress</h2>
        <p className="mt-1 text-sm text-theme-subtle">
          Points from services — visual progress toward next milestone ({nextTier} pts).
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-xs text-theme-subtle">
            {customer.loyaltyPoints || 0} / {nextTier} points
          </p>
          <button
            type="button"
            disabled={sending}
            onClick={() => sendTemplate('loyalty', { nextTier })}
            className="btn-ghost py-1.5 text-xs"
          >
            Send points update (WhatsApp)
          </button>
        </div>
      </div>

      {customer.notes && (
        <div className="glass-panel p-5">
          <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{customer.notes}</p>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="border-b border-theme px-4 py-3">
          <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Visit history</h2>
        </div>
        {visits.length > 0 && (
          <div className="border-b border-theme px-4 py-3">
            <ListSearchBar
              className="max-w-full"
              value={visitQ}
              onChange={(e) => setVisitQ(e.target.value)}
              placeholder="Filter visits by date, services, or amount…"
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-theme-elevated text-xs uppercase text-theme-subtle">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-theme-subtle">
                    No visits yet.
                  </td>
                </tr>
              ) : filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-theme-subtle">
                    No visits match your search.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v) => (
                  <tr key={v._id}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {new Date(v.date || v.visitedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="list-inside list-disc text-theme-muted">
                        {(v.services || []).map((s, i) => (
                          <li key={i}>
                            {s.name} ×{s.quantity}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{formatINR(v.finalAmount)}</td>
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
