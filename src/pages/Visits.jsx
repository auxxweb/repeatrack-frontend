import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Users } from 'lucide-react';
import api from '../lib/api.js';
import { formatINR } from '../lib/formatCurrency.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

export default function Visits() {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customerMode, setCustomerMode] = useState('existing');
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selected, setSelected] = useState({});
  const [discount, setDiscount] = useState('0');
  const [saving, setSaving] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [visitQuery, setVisitQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, s, v] = await Promise.all([
          api.get('/customers'),
          api.get('/services'),
          api.get('/visits'),
        ]);
        setCustomers(c.data);
        setServices(s.data);
        setVisits(v.data);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredServices = useMemo(() => {
    const qq = serviceQuery.trim().toLowerCase();
    if (!qq) return services;
    return services.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(qq) || (s.description || '').toLowerCase().includes(qq)
    );
  }, [services, serviceQuery]);

  const displayVisits = useMemo(() => {
    const qq = visitQuery.trim().toLowerCase();
    let list = visits;
    if (qq) {
      list = visits.filter((v) => {
        const name = (v.customer?.name || '').toLowerCase();
        const phone = String(v.customer?.phone || '').toLowerCase();
        const when = new Date(v.date || v.visitedAt).toLocaleString().toLowerCase();
        const amt = formatINR(v.finalAmount).toLowerCase();
        return name.includes(qq) || phone.includes(qq) || when.includes(qq) || amt.includes(qq);
      });
    }
    return list.slice(0, 60);
  }, [visits, visitQuery]);

  const totals = useMemo(() => {
    let totalPrice = 0;
    let loyalty = 0;
    const lines = [];
    for (const s of services) {
      const q = selected[s._id] || 0;
      if (q > 0) {
        const line = s.offerPrice * q;
        totalPrice += line;
        loyalty += (s.loyaltyPoints || 0) * q;
        lines.push({ name: s.name, q, line, price: s.offerPrice });
      }
    }
    const disc = Math.min(Number(discount) || 0, totalPrice);
    return { totalPrice, finalAmount: totalPrice - disc, loyalty, lines, disc };
  }, [services, selected, discount]);

  function toggleQty(sid, delta) {
    setSelected((prev) => {
      const cur = prev[sid] || 0;
      const next = Math.max(0, cur + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[sid];
      else copy[sid] = next;
      return copy;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const ids = [];
    const quantities = [];
    for (const s of services) {
      const q = selected[s._id] || 0;
      if (q > 0) {
        ids.push(s._id);
        quantities.push(q);
      }
    }
    if (ids.length === 0) {
      toast.error('Choose at least one service');
      return;
    }

    let resolvedCustomerId = customerId;

    if (customerMode === 'existing') {
      if (!customerId) {
        toast.error('Select an existing customer');
        return;
      }
    } else {
      const name = newCustomerName.trim();
      const phone = newCustomerPhone.trim();
      if (!name || !phone) {
        toast.error('Enter name and phone for the new customer');
        return;
      }
    }

    setSaving(true);
    try {
      if (customerMode === 'new') {
        const name = newCustomerName.trim();
        const phone = newCustomerPhone.trim();
        try {
          const { data: created } = await api.post('/customers', { name, phone });
          resolvedCustomerId = created._id;
        } catch (err) {
          const status = err.response?.status;
          const msg = err.response?.data?.message;
          if (status === 409) {
            toast.error(
              msg ||
                'This phone is already registered — use “Existing customer” and pick them from the list.'
            );
          } else {
            toast.error(msg || 'Could not create customer');
          }
          return;
        }
      }

      await api.post('/visits', {
        customer: resolvedCustomerId,
        serviceIds: ids,
        quantities,
        discount: totals.disc,
      });
      toast.success('Visit recorded');
      setSelected({});
      setDiscount('0');
      const [{ data: visitData }, { data: customerData }] = await Promise.all([
        api.get('/visits'),
        api.get('/customers'),
      ]);
      setVisits(visitData);
      setCustomers(customerData);
      if (customerMode === 'new') {
        setNewCustomerName('');
        setNewCustomerPhone('');
        setCustomerMode('existing');
        setCustomerId(resolvedCustomerId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save visit');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const fmt = (n) => formatINR(n);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Walk-in visits
        </h1>
        <p className="mt-1 text-theme-muted">Log a visit — customer stats and loyalty update automatically.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={submit} className="glass-panel space-y-5 p-6">
          <div>
            <p className="mb-2 text-xs font-medium text-theme-muted">Customer</p>
            <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('existing');
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  customerMode === 'existing'
                    ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-500/25 dark:bg-slate-800 dark:text-emerald-300'
                    : 'text-theme-muted hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Users className="h-4 w-4 shrink-0 opacity-80" />
                Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('new');
                  setCustomerId('');
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  customerMode === 'new'
                    ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-500/25 dark:bg-slate-800 dark:text-emerald-300'
                    : 'text-theme-muted hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <UserPlus className="h-4 w-4 shrink-0 opacity-80" />
                New
              </button>
            </div>

            {customerMode === 'existing' ? (
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-theme-muted">Select customer</label>
                <select
                  className="input-field"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Choose from your list…</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="mt-2 text-xs text-theme-subtle">No customers yet — switch to New customer.</p>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-theme-muted">Name</label>
                  <input
                    className="input-field"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Walk-in name"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-theme-muted">Phone</label>
                  <input
                    className="input-field"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="WhatsApp / mobile"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <p className="text-xs text-theme-subtle">
                  A profile is created when you record the visit. If this number already exists, choose Existing
                  instead.
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-theme-subtle">Services</p>
            {services.length > 0 && (
              <ListSearchBar
                className="mb-3 max-w-full"
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                placeholder="Filter services by name…"
              />
            )}
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {services.length === 0 ? (
                <p className="text-sm text-theme-subtle">Add services first.</p>
              ) : filteredServices.length === 0 ? (
                <p className="text-sm text-theme-subtle">No services match your filter.</p>
              ) : (
                filteredServices.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-theme-subtle bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300/90">
                        {fmt(s.offerPrice)} each · {s.loyaltyPoints ?? 0} pts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 rounded-lg bg-slate-200 text-lg leading-none text-slate-800 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        onClick={() => toggleQty(s._id, -1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {selected[s._id] || 0}
                      </span>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-lg bg-slate-200 text-lg leading-none text-slate-800 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        onClick={() => toggleQty(s._id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Manual discount (₹)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-theme-muted">Subtotal</span>
              <span>{fmt(totals.totalPrice)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-theme-muted">Discount</span>
              <span>-{fmt(totals.disc)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-theme pt-2 font-semibold text-slate-900 dark:text-slate-100">
              <span>Final</span>
              <span className="text-emerald-700 dark:text-emerald-300">{fmt(totals.finalAmount)}</span>
            </div>
            <p className="mt-2 text-xs text-theme-subtle">Loyalty earned this visit: {totals.loyalty} pts</p>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Record visit'}
          </button>
        </form>

        <div className="glass-panel overflow-hidden">
          <div className="border-b border-theme px-4 py-3">
            <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">Recent visits</h2>
            <p className="mt-1 text-xs text-theme-subtle">Latest recorded visits for your store.</p>
          </div>
          {visits.length > 0 && (
            <div className="border-b border-theme px-4 py-3">
              <ListSearchBar
                className="max-w-full"
                value={visitQuery}
                onChange={(e) => setVisitQuery(e.target.value)}
                placeholder="Filter by customer, phone, date, or amount…"
              />
            </div>
          )}
          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-100/95 text-xs uppercase text-theme-subtle backdrop-blur dark:bg-surface-900/95">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {displayVisits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-theme-subtle">
                      {visits.length === 0 ? 'No visits yet.' : 'No visits match your search.'}
                    </td>
                  </tr>
                ) : (
                  displayVisits.map((v) => (
                  <tr key={v._id}>
                    <td className="px-4 py-2 text-theme-muted">
                      {new Date(v.date || v.visitedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{v.customer?.name || '—'}</td>
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{fmt(v.finalAmount)}</td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
