import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Eye, Pencil, Trash2, Ban, CheckCircle } from 'lucide-react';
import api from '../lib/api.js';
import Modal from '../components/Modal.jsx';
import ListSearchBar from '../components/ListSearchBar.jsx';

const plans = ['starter', 'growth', 'pro', 'enterprise'];

const emptyForm = {
  businessName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  ownerPasswordConfirm: '',
  phone: '',
  email: '',
  plan: 'starter',
};

export default function AdminBusinesses() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    businessName: '',
    ownerName: '',
    ownerEmail: '',
    ownerNewPassword: '',
    ownerNewPasswordConfirm: '',
    phone: '',
    email: '',
    plan: 'starter',
  });

  async function load() {
    const { data } = await api.get('/admin/business');
    setRows(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (form.ownerPassword !== form.ownerPasswordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.ownerPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/admin/business', {
        businessName: form.businessName,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
        phone: form.phone,
        email: form.email || undefined,
        plan: form.plan,
      });
      toast.success(data.message || 'Business created');
      setCreatedInfo({ email: data.credentials?.email || form.ownerEmail });
      resetForm();
      setCreateOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create business');
    } finally {
      setSaving(false);
    }
  }

  async function openView(row) {
    setViewOpen(true);
    setViewData(null);
    setViewLoading(true);
    try {
      const { data } = await api.get(`/admin/business/${row._id}`);
      setViewData(data);
    } catch {
      toast.error('Could not load details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }

  function openEdit(row) {
    setEditId(row._id);
    setEditForm({
      businessName: row.name || '',
      ownerName: row.ownerName || '',
      ownerEmail: row.owner?.email || '',
      ownerNewPassword: '',
      ownerNewPasswordConfirm: '',
      phone: row.phone || '',
      email: row.email || '',
      plan: row.plan || 'starter',
    });
    setEditOpen(true);
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (editForm.ownerNewPassword || editForm.ownerNewPasswordConfirm) {
      if (editForm.ownerNewPassword !== editForm.ownerNewPasswordConfirm) {
        toast.error('New passwords do not match');
        return;
      }
      if (editForm.ownerNewPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        businessName: editForm.businessName,
        ownerName: editForm.ownerName,
        ownerEmail: editForm.ownerEmail,
        phone: editForm.phone,
        email: editForm.email || '',
        plan: editForm.plan,
      };
      if (editForm.ownerNewPassword) {
        payload.ownerNewPassword = editForm.ownerNewPassword;
      }
      await api.patch(`/admin/business/${editId}`, payload);
      toast.success('Business updated');
      setEditOpen(false);
      setEditId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(row, unblock) {
    const next = unblock ? 'active' : 'inactive';
    const label = unblock ? 'unblocked' : 'blocked';
    try {
      await api.patch(`/admin/business/${row._id}`, { status: next });
      toast.success(`Business ${label}`);
      await load();
    } catch {
      toast.error('Update failed');
    }
  }

  async function handleDelete(row) {
    const name = row.name || 'this business';
    if (
      !confirm(
        `Delete "${name}" and its owner login? All customers, visits, bookings, and services for this tenant will be permanently removed.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/admin/business/${row._id}`);
      toast.success('Business deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  }

  const filteredRows = useMemo(() => {
    let list = rows;
    if (statusFilter === 'active') list = list.filter((r) => r.status === 'active');
    if (statusFilter === 'blocked') list = list.filter((r) => r.status !== 'active');
    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter((r) => {
      const plan = String(r.plan || '').toLowerCase();
      const ownerEmail = String(r.owner?.email || '').toLowerCase();
      return (
        (r.name || '').toLowerCase().includes(qq) ||
        (r.ownerName || '').toLowerCase().includes(qq) ||
        ownerEmail.includes(qq) ||
        plan.includes(qq)
      );
    });
  }, [rows, q, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="font-admin space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Businesses</h1>
          <p className="mt-1 text-theme-muted">
            Create a business and owner login. Owners sign in at{' '}
            <strong className="text-slate-800 dark:text-slate-300">/login</strong>.
          </p>
        </div>
        <button type="button" className="btn-admin-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New business
        </button>
      </div>

      {createdInfo && (
        <div className="admin-card border border-emerald-200/80 bg-emerald-50/90 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">Owner account ready</p>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            Login email: <code className="code-inline text-slate-900 dark:text-white">{createdInfo.email}</code>
          </p>
          <p className="mt-2 text-xs text-theme-subtle">
            Owner sign-in: <code className="code-inline">{window.location.origin}/login</code>
          </p>
          <button type="button" className="btn-ghost mt-3 text-xs" onClick={() => setCreatedInfo(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <ListSearchBar
          className="max-w-full sm:max-w-md sm:flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search business, owner, email, or plan…"
        />
        <div className="flex flex-col gap-1.5 sm:min-w-[160px]">
          <label className="text-xs font-medium text-theme-muted" htmlFor="admin-biz-status">
            Status
          </label>
          <select
            id="admin-biz-status"
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active only</option>
            <option value="blocked">Blocked only</option>
          </select>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-theme bg-theme-elevated text-xs uppercase text-theme-subtle">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Login email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-theme-subtle">
                    {rows.length === 0 ? 'No businesses yet.' : 'No businesses match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                  <td className="px-4 py-3 text-theme-muted">{r.ownerName}</td>
                  <td className="px-4 py-3 text-theme-muted">{r.owner?.email ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-slate-800 dark:text-slate-100">{r.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === 'active'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'
                      }`}
                    >
                      {r.status === 'active' ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-theme bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        onClick={() => openView(r)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-theme bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {r.status === 'active' ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                          onClick={() => toggleBlock(r, false)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Block
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                          onClick={() => toggleBlock(r, true)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Unblock
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                        onClick={() => handleDelete(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Business details"
        wide
        panelClassName="font-admin sm:rounded-3xl"
        titleClassName="font-admin"
      >
        {viewLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}
        {!viewLoading && viewData && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-theme-subtle">Business name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{viewData.business.name}</p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Plan</p>
                <p className="font-medium capitalize text-slate-900 dark:text-slate-100">{viewData.business.plan}</p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Owner name (record)</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{viewData.business.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Status</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {viewData.business.status === 'active' ? 'Active' : 'Blocked'}
                </p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Phone</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{viewData.business.phone}</p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Business email</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{viewData.business.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Booking slug</p>
                <p className="break-all font-mono text-xs text-emerald-800 dark:text-emerald-300">
                  {viewData.business.bookingSlug}
                </p>
              </div>
              <div>
                <p className="text-xs text-theme-subtle">Public booking URL</p>
                <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-300">
                  {window.location.origin}/book/{viewData.business.bookingSlug}
                </p>
              </div>
            </div>
            <div className="border-t border-theme pt-4">
              <p className="mb-2 text-xs font-medium uppercase text-theme-subtle">Owner login</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-theme-subtle">Email</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{viewData.owner?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-theme-subtle">Display name</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{viewData.owner?.name ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit business & owner"
        wide
        panelClassName="font-admin sm:rounded-3xl"
        titleClassName="font-admin"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Business name</label>
              <input
                className="input-field"
                value={editForm.businessName}
                onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Owner display name</label>
              <input
                className="input-field"
                value={editForm.ownerName}
                onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Owner login email</label>
            <input
              className="input-field"
              type="email"
              value={editForm.ownerEmail}
              onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">New password (optional)</label>
              <input
                className="input-field"
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep current"
                value={editForm.ownerNewPassword}
                onChange={(e) => setEditForm({ ...editForm, ownerNewPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Confirm new password</label>
              <input
                className="input-field"
                type="password"
                autoComplete="new-password"
                value={editForm.ownerNewPasswordConfirm}
                onChange={(e) => setEditForm({ ...editForm, ownerNewPasswordConfirm: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Business phone</label>
              <input
                className="input-field"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Business email (optional)</label>
              <input
                className="input-field"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Plan</label>
            <select
              className="input-field"
              value={editForm.plan}
              onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
            >
              {plans.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create business & owner login"
        wide
        panelClassName="font-admin sm:rounded-3xl"
        titleClassName="font-admin"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/90 px-3 py-2 text-xs text-theme-muted dark:bg-emerald-500/10">
            The owner will use <strong className="text-slate-800 dark:text-slate-300">Owner email</strong> and{' '}
            <strong className="text-slate-800 dark:text-slate-300">Password</strong> at{' '}
            <code className="rounded bg-slate-200/80 px-1 py-0.5 text-slate-800 dark:bg-white/10 dark:text-slate-200">
              /login
            </code>
            .
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Business name</label>
              <input
                className="input-field"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Owner display name</label>
              <input
                className="input-field"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Owner login email</label>
            <input
              className="input-field"
              type="email"
              autoComplete="off"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Owner password (min 6)</label>
              <input
                className="input-field"
                type="password"
                autoComplete="new-password"
                value={form.ownerPassword}
                onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Confirm password</label>
              <input
                className="input-field"
                type="password"
                autoComplete="new-password"
                value={form.ownerPasswordConfirm}
                onChange={(e) => setForm({ ...form, ownerPasswordConfirm: e.target.value })}
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Business phone</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-theme-muted">Business email (optional)</label>
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-theme-muted">Subscription plan</label>
            <select
              className="input-field"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              {plans.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create business & owner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
