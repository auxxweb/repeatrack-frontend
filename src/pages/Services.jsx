import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api.js';
import { formatINR } from '../lib/formatCurrency.js';
import Modal from '../components/Modal.jsx';
import ListSearchBar from '../components/ListSearchBar.jsx';

const empty = {
  name: '',
  description: '',
  actualPrice: '',
  offerPrice: '',
  loyaltyPoints: '0',
};

export default function Services() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/services');
    setList(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setModal(true);
  }

  function openEdit(s) {
    setEditId(s._id);
    setForm({
      name: s.name,
      description: s.description || '',
      actualPrice: String(s.actualPrice),
      offerPrice: String(s.offerPrice),
      loyaltyPoints: String(s.loyaltyPoints ?? 0),
    });
    setModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      actualPrice: Number(form.actualPrice),
      offerPrice: Number(form.offerPrice),
      loyaltyPoints: Number(form.loyaltyPoints) || 0,
    };
    try {
      if (editId) {
        await api.put(`/services/${editId}`, payload);
        toast.success('Service updated');
      } else {
        await api.post('/services', payload);
        toast.success('Service created');
      }
      setModal(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Deleted');
      await load();
    } catch {
      toast.error('Could not delete');
    }
  }

  const money = (n) => formatINR(n);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      return name.includes(qq) || desc.includes(qq);
    });
  }, [list, q]);

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
            Services
          </h1>
          <p className="mt-1 text-theme-muted">Pricing, offers, and loyalty points per service.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add service
        </button>
      </div>

      <ListSearchBar
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by service name or description"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-3xl border border-dashed border-slate-200 py-12 text-center text-sm text-theme-subtle dark:border-white/10">
            {list.length === 0 ? 'No services yet — add your first one.' : 'No services match your search.'}
          </p>
        ) : (
          filtered.map((s) => (
          <div key={s._id} className="glass-panel flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">{s.name}</h2>
                {s.description && <p className="mt-1 text-sm text-theme-muted">{s.description}</p>}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={() => openEdit(s)}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-600 hover:bg-red-100 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                  onClick={() => handleDelete(s._id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-theme-subtle">List price</p>
                <p className="font-medium text-slate-600 line-through opacity-80 dark:text-slate-300">
                  {money(s.actualPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Offer</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{money(s.offerPrice)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-theme-subtle">Loyalty points</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{s.loyaltyPoints ?? 0} pts / purchase</p>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit service' : 'New service'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Description</label>
            <textarea
              className="input-field min-h-[72px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Actual price (₹)</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                value={form.actualPrice}
                onChange={(e) => setForm({ ...form, actualPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Offer price (₹)</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                value={form.offerPrice}
                onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Loyalty points</label>
            <input
              className="input-field"
              type="number"
              min="0"
              value={form.loyaltyPoints}
              onChange={(e) => setForm({ ...form, loyaltyPoints: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
