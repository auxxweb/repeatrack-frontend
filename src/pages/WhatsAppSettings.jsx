import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import ListSearchBar from '../components/ListSearchBar.jsx';

const PLACEHOLDER_HELP = (
  <p className="text-xs text-theme-subtle">
    Use placeholders:{' '}
    <code className="code-inline">{'{{name}}'}</code>, <code className="code-inline">{'{{businessName}}'}</code>
    {', '}
    <code className="code-inline">{'{{points}}'}</code>, <code className="code-inline">{'{{nextTier}}'}</code> (loyalty),{' '}
    <code className="code-inline">{'{{bookingDate}}'}</code>, <code className="code-inline">{'{{services}}'}</code>,{' '}
    <code className="code-inline">{'{{bookingStatus}}'}</code>, <code className="code-inline">{'{{notes}}'}</code>{' '}
    (booking).
  </p>
);

export default function WhatsAppSettings() {
  const [meta, setMeta] = useState([]);
  const [fields, setFields] = useState({});
  const [defaults, setDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/business/whatsapp-templates');
        setMeta(data.meta || []);
        const init = {};
        for (const m of data.meta || []) {
          init[m.id] = data.effective?.[m.id] ?? data.defaults?.[m.id] ?? '';
        }
        setFields(init);
        setDefaults(data.defaults || {});
      } catch {
        toast.error('Could not load templates');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setField(id, v) {
    setFields((f) => ({ ...f, [id]: v }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/business/whatsapp-templates', fields);
      toast.success('WhatsApp templates saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function resetOne(id) {
    const d = defaults[id] ?? '';
    setField(id, d);
    toast.success('Reset to default in editor — save to apply');
  }

  const filteredMeta = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return meta;
    return meta.filter(
      (m) =>
        (m.label || '').toLowerCase().includes(qq) ||
        (m.description || '').toLowerCase().includes(qq) ||
        String(m.id || '').toLowerCase().includes(qq)
    );
  }, [meta, q]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          WhatsApp message templates
        </h1>
        <p className="mt-1 text-theme-muted">
          Edit messages used when you tap WhatsApp actions (comeback, loyalty, booking updates). Each message
          opens in WhatsApp with the customer&apos;s number via a <strong className="text-slate-800 dark:text-slate-200">wa.me</strong> link.
        </p>
        {PLACEHOLDER_HELP}
      </div>

      {meta.length > 0 && (
        <ListSearchBar
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search templates by name, description, or id…"
        />
      )}

      <form onSubmit={save} className="space-y-6">
        {filteredMeta.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-200 py-12 text-center text-sm text-theme-subtle dark:border-white/10">
            No templates match your search.
          </p>
        ) : (
          filteredMeta.map((m) => (
          <div key={m.id} className="admin-card p-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-admin text-lg font-semibold text-slate-900 dark:text-white">{m.label}</h2>
                <p className="text-sm text-theme-subtle">{m.description}</p>
              </div>
              <button
                type="button"
                className="btn-ghost shrink-0 py-1.5 text-xs"
                onClick={() => resetOne(m.id)}
              >
                Reset to default
              </button>
            </div>
            <textarea
              className="input-field mt-2 min-h-[120px] font-mono text-sm"
              value={fields[m.id] ?? ''}
              onChange={(e) => setField(m.id, e.target.value)}
              spellCheck
            />
          </div>
          ))
        )}

        <div className="flex justify-end gap-2">
          <button type="submit" className="btn-admin-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save templates'}
          </button>
        </div>
      </form>
    </div>
  );
}
