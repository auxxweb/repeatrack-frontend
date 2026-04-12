import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatINR } from '../lib/formatCurrency.js';
import { API_BASE } from '../lib/api.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

const publicApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

function serviceKey(s) {
  const id = s?._id ?? s?.id;
  if (id == null) return '';
  return typeof id === 'string' ? id : id.toString?.() ?? String(id);
}

function bookingErrorMessage(err) {
  if (err?.response?.data != null) {
    const d = err.response.data;
    if (typeof d.message === 'string' && d.message) return d.message;
    if (Array.isArray(d.errors) && d.errors.length) {
      const first = d.errors[0];
      const part = first?.msg || first?.message || (typeof first === 'string' ? first : '');
      if (part) return part;
    }
  }
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot reach the server. If this is a deployed site, set VITE_API_URL to your API URL and rebuild.';
  }
  if (err instanceof RangeError) return 'Invalid date or time.';
  return err?.message || 'Could not book';
}

export default function PublicBook() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState({});
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [serviceQ, setServiceQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await publicApi.get(`/public/booking/${encodeURIComponent(slug)}`);
        if (!cancelled) {
          setData(d);
          const dt = new Date();
          dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
          setScheduledAt(dt.toISOString().slice(0, 16));
        }
      } catch {
        toast.error('Booking page not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function toggle(rawId) {
    const id = typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? String(rawId);
    if (!id || id === 'undefined') return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const ids = [...new Set(Object.keys(selected))].filter(Boolean);
    if (ids.length === 0) {
      toast.error('Choose at least one service');
      return;
    }
    const t = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(t.getTime())) {
      toast.error('Please choose a valid date and time.');
      return;
    }
    setSaving(true);
    try {
      await publicApi.post(`/public/booking/${encodeURIComponent(slug)}`, {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        serviceIds: ids,
        scheduledAt: t.toISOString(),
      });
      setDone(true);
      toast.success("You're booked!");
    } catch (err) {
      toast.error(bookingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    const qq = serviceQ.trim().toLowerCase();
    if (!qq) return data.services;
    return data.services.filter((s) => (s.name || '').toLowerCase().includes(qq));
  }, [data, serviceQ]);

  if (loading) {
    return (
      <div className="bg-theme-page flex min-h-[100dvh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-theme-page flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
        <h1 className="font-admin text-xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-theme-muted">This booking link is invalid.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-theme-page flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
        <div className="glass-panel max-w-md p-10">
          <h1 className="font-admin text-2xl font-bold text-emerald-600 dark:text-emerald-300">Booking received</h1>
          <p className="mt-3 text-theme-muted">
            Thanks {name}. {data.businessName} will confirm your appointment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-page min-h-[100dvh] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-xl font-bold text-white shadow-md">
            R
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400/90">
            Book online
          </p>
          <h1 className="mt-2 font-admin text-2xl font-bold text-slate-900 dark:text-white">{data.businessName}</h1>
          <p className="mt-1 text-sm text-theme-muted">Choose services and a time — no app required.</p>
        </div>

        <form onSubmit={submit} className="glass-panel space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Your name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Phone (WhatsApp)</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Preferred time</label>
            <input
              className="input-field"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-theme-subtle">Services</p>
            {data.services.length === 0 ? (
              <p className="text-sm text-theme-subtle">No services published yet.</p>
            ) : (
              <>
                <ListSearchBar
                  className="mb-3 max-w-full"
                  value={serviceQ}
                  onChange={(e) => setServiceQ(e.target.value)}
                  placeholder="Search services…"
                />
                <div className="space-y-2">
                {filteredServices.length === 0 ? (
                  <p className="text-sm text-theme-subtle">No services match your search.</p>
                ) : (
                  filteredServices.map((s) => {
                  const kid = serviceKey(s);
                  return (
                    <button
                      key={kid || s.name}
                      type="button"
                      onClick={() => toggle(kid)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                        kid && selected[kid]
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : 'border-theme-subtle bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-emerald-700 dark:text-emerald-300">{formatINR(s.offerPrice)}</span>
                    </button>
                  );
                })
                )}
              </div>
              </>
            )}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving || data.services.length === 0}>
            {saving ? 'Sending…' : 'Request booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
