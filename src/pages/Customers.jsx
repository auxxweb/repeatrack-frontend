import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import api from '../lib/api.js';
import { formatINR } from '../lib/formatCurrency.js';
import Modal from '../components/Modal.jsx';
import ListSearchBar from '../components/ListSearchBar.jsx';

export default function Customers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get('/customers');
    setList(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', { name, phone, notes });
      toast.success('Customer added');
      setModal(false);
      setName('');
      setPhone('');
      setNotes('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const qq = q.trim().toLowerCase();
  const filtered = qq
    ? list.filter(
        (c) =>
          c.name.toLowerCase().includes(qq) ||
          String(c.phone || '').toLowerCase().includes(qq)
      )
    : list;

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
            Customers
          </h1>
          <p className="mt-1 text-theme-muted">Profiles, loyalty, and visit history.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModal(true)}>
          <Plus className="h-4 w-4" />
          Add customer
        </button>
      </div>

      <ListSearchBar
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or phone"
      />

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-theme bg-theme-elevated text-xs uppercase tracking-wide text-theme-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 font-medium">Spent</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Last visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-theme-subtle">
                    {list.length === 0 ? 'No customers yet.' : 'No matches for your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link
                      to={`/customers/${c._id}`}
                      className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-theme-muted">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{c.totalVisits}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{formatINR(c.totalSpent || 0)}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{c.loyaltyPoints ?? 0}</td>
                  <td className="px-4 py-3 text-theme-muted">
                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New customer">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Name</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Phone</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Notes (optional)</label>
            <textarea className="input-field min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
