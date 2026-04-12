import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarPlus, CheckCircle2, XCircle, ArrowRightCircle, MessageCircle } from 'lucide-react';
import api from '../lib/api.js';
import Modal from '../components/Modal.jsx';
import ListSearchBar from '../components/ListSearchBar.jsx';
import { openWhatsAppFromResponse } from '../lib/openWhatsApp.js';

const statusBadge = {
  booked: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  completed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  missed: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [convertBooking, setConvertBooking] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    serviceIds: [],
    scheduledAt: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [waBusy, setWaBusy] = useState({});
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  function resolveCustomerId(b) {
    const raw = b.customer?._id ?? b.customer;
    if (raw) return typeof raw === 'string' ? raw : raw._id ?? String(raw);
    const digits = b.customerPhone?.replace(/\D/g, '');
    if (!digits) return null;
    const m = customers.find((c) => String(c.phone || '').replace(/\D/g, '') === digits);
    return m?._id;
  }

  async function sendBookingWhatsApp(b) {
    const customerId = resolveCustomerId(b);
    if (!customerId) {
      toast.error('Link this booking to a customer (same phone) to send WhatsApp.');
      return;
    }
    setWaBusy((s) => ({ ...s, [b._id]: true }));
    try {
      const { data: res } = await api.post('/whatsapp/send', {
        customerId,
        template: 'booking',
        bookingId: b._id,
      });
      if (openWhatsAppFromResponse(res)) {
        toast.success('Opening WhatsApp…', { duration: 3500 });
      } else {
        toast.success('Ready');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'WhatsApp link failed');
    } finally {
      setWaBusy((s) => ({ ...s, [b._id]: false }));
    }
  }

  async function load() {
    const [b, c, s] = await Promise.all([
      api.get('/bookings'),
      api.get('/customers'),
      api.get('/services'),
    ]);
    setBookings(b.data);
    setCustomers(c.data);
    setServices(s.data);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openCreate() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setForm({
      customerName: '',
      customerPhone: '',
      serviceIds: [],
      scheduledAt: d.toISOString().slice(0, 16),
      notes: '',
    });
    setModal(true);
  }

  function toggleService(id) {
    setForm((f) => {
      const has = f.serviceIds.includes(id);
      return {
        ...f,
        serviceIds: has ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
      };
    });
  }

  async function createBooking(e) {
    e.preventDefault();
    if (form.serviceIds.length === 0) {
      toast.error('Pick at least one service');
      return;
    }
    setSaving(true);
    try {
      await api.post('/bookings', {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        serviceIds: form.serviceIds,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        notes: form.notes,
      });
      toast.success('Booking created');
      setModal(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id, status) {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success('Updated');
      await load();
    } catch {
      toast.error('Update failed');
    }
  }

  async function convertToVisit() {
    if (!convertBooking) return;
    const b = convertBooking;
    setSaving(true);
    try {
      await api.post('/visits', {
        bookingId: b._id,
        discount: 0,
      });
      toast.success('Visit recorded from booking');
      setConvertBooking(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not convert');
    } finally {
      setSaving(false);
    }
  }

  const filteredBookings = useMemo(() => {
    let rows = bookings;
    if (statusFilter !== 'all') {
      rows = rows.filter((b) => b.status === statusFilter);
    }
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((b) => {
      const servicesStr = (b.services || [])
        .map((x) => x.name || '')
        .join(' ')
        .toLowerCase();
      return (
        (b.customerName || '').toLowerCase().includes(qq) ||
        String(b.customerPhone || '')
          .toLowerCase()
          .includes(qq) ||
        String(b.notes || '')
          .toLowerCase()
          .includes(qq) ||
        servicesStr.includes(qq) ||
        String(b.status || '').toLowerCase().includes(qq)
      );
    });
  }, [bookings, q, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Bookings
          </h1>
          <p className="mt-1 text-theme-muted">Admin scheduling and convert completed visits.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <CalendarPlus className="h-4 w-4" />
          New booking
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <ListSearchBar
          className="max-w-full sm:max-w-md sm:flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customer, phone, services, notes…"
        />
        <div className="flex flex-col gap-1.5 sm:min-w-[160px]">
          <label className="text-xs font-medium text-theme-muted" htmlFor="booking-status-filter">
            Status
          </label>
          <select
            id="booking-status-filter"
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-theme bg-theme-elevated text-xs uppercase text-theme-subtle">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-theme-subtle">
                    {bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {new Date(b.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{b.customerName}</p>
                    <p className="text-xs text-theme-subtle">{b.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-theme-muted">
                    {(b.services || []).map((s) => s.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={waBusy[b._id]}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/15 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-600/25 disabled:opacity-50 dark:text-emerald-300"
                        onClick={() => sendBookingWhatsApp(b)}
                        title="Opens wa.me with booking template"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </button>
                      {b.status === 'booked' && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-500/25 dark:text-emerald-200"
                            onClick={() => setConvertBooking(b)}
                          >
                            <ArrowRightCircle className="mr-1 inline h-3.5 w-3.5" />
                            Convert
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                            onClick={() => setStatus(b._id, 'missed')}
                          >
                            <XCircle className="mr-1 inline h-3.5 w-3.5" />
                            Missed
                          </button>
                        </>
                      )}
                      {b.status === 'missed' && (
                        <button
                          type="button"
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                          onClick={() => setStatus(b._id, 'booked')}
                        >
                          Re-open
                        </button>
                      )}
                      {b.status === 'completed' && (
                        <span className="text-xs text-theme-subtle">
                          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Done
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New booking" wide>
        <form onSubmit={createBooking} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Name</label>
              <input
                className="input-field"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Phone</label>
              <input
                className="input-field"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                required
              />
            </div>
          </div>
          <p className="text-xs text-theme-subtle">
            The customer is matched or created automatically from the phone number — no duplicate numbers for your
            store.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Date & time</label>
            <input
              className="input-field"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              required
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-theme-subtle">Services</p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => toggleService(s._id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    form.serviceIds.includes(s._id)
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Notes</label>
            <textarea
              className="input-field min-h-[64px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!convertBooking}
        onClose={() => setConvertBooking(null)}
        title="Convert booking to visit"
      >
        {convertBooking && (
          <div className="space-y-4 text-sm">
            <p className="text-theme-muted">
              Completes the booking and records a visit. The customer profile is matched or created from the phone
              number on this booking.
            </p>
            <p>
              <span className="text-theme-subtle">Customer:</span>{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{convertBooking.customerName}</span>{' '}
              —{' '}
              {convertBooking.customerPhone}
            </p>
            <button type="button" className="btn-primary w-full" disabled={saving} onClick={convertToVisit}>
              {saving ? 'Working…' : 'Confirm visit'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
