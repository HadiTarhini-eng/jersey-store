import { useEffect, useState } from 'react';
import { shippingApi, siteConfigApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import type {
  CreateShippingMethodPayload, ShippingMethod, SiteConfig, UpdateSiteConfigPayload,
} from '../../types';
import { ConfirmModal } from '../components/ConfirmModal';

const inputClass = 'w-full bg-surface-raised border border-stroke rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent';

type Tab = 'site' | 'shipping';

export function AdminSettings() {
  const [tab, setTab] = useState<Tab>('site');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
        <TabButton active={tab === 'site'}     onClick={() => setTab('site')}>Site</TabButton>
        <TabButton active={tab === 'shipping'} onClick={() => setTab('shipping')}>Shipping</TabButton>
      </div>

      {tab === 'site' && <SiteTab />}
      {tab === 'shipping' && <ShippingTab />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
        active ? 'bg-accent text-white border-2 border-accent' : 'bg-surface border-2 border-stroke text-secondary hover:text-primary',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── Site config ────────────────────────────────────────────────────────────────

function SiteTab() {
  const [config, setConfig]  = useState<SiteConfig | null>(null);
  const [form,   setForm]    = useState<UpdateSiteConfigPayload>({});
  const [loading,setLoading] = useState(true);
  const [error,  setError]   = useState<string | null>(null);
  const [saving, setSaving]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await siteConfigApi.get();
        setConfig(data);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load site config'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = <K extends keyof UpdateSiteConfigPayload>(key: K): UpdateSiteConfigPayload[K] => {
    if (form[key] !== undefined) return form[key];
    return (config as unknown as Record<string, unknown>)?.[key as string] as UpdateSiteConfigPayload[K];
  };
  const set = <K extends keyof UpdateSiteConfigPayload>(key: K, val: UpdateSiteConfigPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await siteConfigApi.update(form);
      setConfig(updated);
      setForm({});
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted text-sm">Loading…</p>;
  if (!config) return <p className="text-red-500 text-sm">{error ?? 'No config loaded'}</p>;

  const socialLinks = (value('socialLinks') as Record<string, string>) ?? {};
  const setSocial = (k: string, v: string) => set('socialLinks', { ...socialLinks, [k]: v });

  return (
    <section className="bg-surface border border-stroke rounded-2xl p-5 space-y-4">
      <Field label="Store name"><input className={inputClass} value={(value('name') as string) ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
      <Field label="Tagline"><input className={inputClass} value={(value('tagline') as string) ?? ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
      <Field label="Description"><textarea rows={3} className={inputClass} value={(value('description') as string) ?? ''} onChange={(e) => set('description', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email"><input className={inputClass} value={(value('email') as string) ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><input className={inputClass} value={(value('phone') as string) ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency"><input className={inputClass} value={(value('currency') as string) ?? ''} onChange={(e) => set('currency', e.target.value)} /></Field>
        <Field label="Free shipping threshold">
          <input
            type="number" min="0" step="0.01" className={inputClass}
            value={(value('freeShippingThreshold') as number) ?? 0}
            onChange={(e) => set('freeShippingThreshold', Number(e.target.value))}
          />
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs uppercase tracking-widest text-muted mb-2">Social links</legend>
        {(['instagram', 'twitter', 'facebook', 'youtube'] as const).map((key) => (
          <Field key={key} label={key}>
            <input className={inputClass} value={socialLinks[key] ?? ''} onChange={(e) => setSocial(key, e.target.value)} />
          </Field>
        ))}
      </fieldset>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end pt-3 border-t border-stroke">
        <button
          type="button"
          onClick={save}
          disabled={saving || Object.keys(form).length === 0}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

// ── Shipping methods ───────────────────────────────────────────────────────────

function ShippingTab() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ShippingMethod | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setMethods(await shippingApi.list());
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load shipping methods'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const onSave = async (data: CreateShippingMethodPayload, id?: string) => {
    try {
      if (id) await shippingApi.update(id, data);
      else    await shippingApi.create(data);
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save shipping method'));
    } finally {
      setEditing(null);
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    try { await shippingApi.delete(id); await refresh(); }
    catch (err) { setError(extractErrorMessage(err, 'Failed to delete')); }
    finally { setPendingDelete(null); }
  };

  const onToggle = async (m: ShippingMethod) => {
    try {
      if (m.isActive) await shippingApi.deactivate(m.id);
      else            await shippingApi.activate(m.id);
      await refresh();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to toggle'));
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted">{methods.length} method{methods.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider"
        >
          + Add method
        </button>
      </div>

      {loading && <p className="text-muted text-sm">Loading…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {methods.map((m) => (
          <div key={m.id} className="bg-surface border border-stroke rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-primary">{m.name}</p>
              <button
                type="button"
                onClick={() => onToggle(m)}
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${m.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-500/15 text-gray-500'}`}
              >
                {m.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            {m.description && <p className="text-sm text-secondary">{m.description}</p>}
            <p className="text-sm text-primary font-bold">${m.baseRate.toFixed(2)}</p>
            <p className="text-xs text-muted">
              {m.estimatedDaysMin && m.estimatedDaysMax
                ? `${m.estimatedDaysMin}-${m.estimatedDaysMax} days`
                : '—'}
              {m.freeShippingThreshold ? ` • free over $${m.freeShippingThreshold}` : ''}
            </p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(m)} className="text-xs uppercase tracking-widest text-secondary hover:text-primary">Edit</button>
              <button type="button" onClick={() => setPendingDelete(m)} className="text-xs uppercase tracking-widest text-red-500 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <ShippingEditor
          method={editing}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={(data) => onSave(data, editing?.id)}
        />
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete shipping method"
        message={pendingDelete ? `Delete "${pendingDelete.name}"?` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && onDelete(pendingDelete.id)}
      />
    </section>
  );
}

function ShippingEditor({ method, onCancel, onSave }: { method: ShippingMethod | null; onCancel: () => void; onSave: (data: CreateShippingMethodPayload) => void }) {
  const [form, setForm] = useState<CreateShippingMethodPayload>({
    name:                  method?.name                  ?? '',
    description:           method?.description           ?? '',
    baseRate:              method?.baseRate              ?? 0,
    freeShippingThreshold: method?.freeShippingThreshold ?? null,
    estimatedDaysMin:      method?.estimatedDaysMin      ?? null,
    estimatedDaysMax:      method?.estimatedDaysMax      ?? null,
    sortOrder:             method?.sortOrder             ?? 0,
  });

  const set = <K extends keyof CreateShippingMethodPayload>(k: K, v: CreateShippingMethodPayload[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-surface border border-stroke rounded-2xl p-5 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-bold text-primary">{method ? 'Edit method' : 'New method'}</p>
        <Field label="Name"><input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Description"><textarea rows={2} className={inputClass} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base rate ($)"><input type="number" min="0" step="0.01" className={inputClass} value={form.baseRate} onChange={(e) => set('baseRate', Number(e.target.value))} /></Field>
          <Field label="Free above ($)"><input type="number" min="0" step="0.01" className={inputClass} value={form.freeShippingThreshold ?? ''} onChange={(e) => set('freeShippingThreshold', e.target.value === '' ? null : Number(e.target.value))} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min days"><input type="number" min="0" className={inputClass} value={form.estimatedDaysMin ?? ''} onChange={(e) => set('estimatedDaysMin', e.target.value === '' ? null : Number(e.target.value))} /></Field>
          <Field label="Max days"><input type="number" min="0" className={inputClass} value={form.estimatedDaysMax ?? ''} onChange={(e) => set('estimatedDaysMax', e.target.value === '' ? null : Number(e.target.value))} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-stroke">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-secondary hover:text-primary">Cancel</button>
          <button type="button" onClick={() => onSave(form)} className="px-5 py-2 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-wider">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
