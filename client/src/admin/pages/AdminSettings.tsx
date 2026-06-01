import { useEffect, useState } from 'react';
import { siteConfigApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import type { SiteConfig, UpdateSiteConfigPayload } from '../../types';

const inputClass = 'w-full bg-surface-raised border border-stroke rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent';

/** Socials the storefront knows how to render — order mirrors socialPlatforms.tsx. */
const SOCIAL_FIELDS: { key: string; placeholder: string }[] = [
  { key: 'instagram', placeholder: 'https://instagram.com/yourstore' },
  { key: 'twitter',   placeholder: 'https://twitter.com/yourstore' },
  { key: 'facebook',  placeholder: 'https://facebook.com/yourstore' },
  { key: 'youtube',   placeholder: 'https://youtube.com/@yourstore' },
  { key: 'whatsapp',  placeholder: 'https://wa.me/15551234567' },
];

export function AdminSettings() {
  return (
    <div className="space-y-5">
      <SiteTab />
    </div>
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

  // Per-social visibility — missing key ⇒ visible, so we only store an explicit
  // `false` when the admin hides one. Hides the social everywhere it renders
  // (footer, contact page, and the floating WhatsApp button).
  const socialVisible = (value('socialLinksVisible') as Record<string, boolean>) ?? {};
  const setSocialVisible = (k: string, v: boolean) =>
    set('socialLinksVisible', { ...socialVisible, [k]: v });

  // Homepage section visibility — keyed map. Missing keys default to "on" on
  // the storefront, so admin only needs to flip the toggle when they want a
  // section hidden. Add new sections by appending to HOMEPAGE_SECTIONS.
  const HOMEPAGE_SECTIONS: { key: string; label: string; hint: string }[] = [
    { key: 'shop-by-sport', label: 'Shop by Sport', hint: 'Section above the team slider on the homepage.' },
  ];
  const sectionsVisible = (value('homepageSectionsVisible') as Record<string, boolean>) ?? {};
  const setSectionVisible = (k: string, v: boolean) =>
    set('homepageSectionsVisible', { ...sectionsVisible, [k]: v });

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
        <Field label="Shipping fee">
          <input
            type="number" min="0" step="0.01" className={inputClass}
            value={(value('shippingFee') as number) ?? 0}
            onChange={(e) => set('shippingFee', Number(e.target.value))}
          />
        </Field>
      </div>
      <p className="text-[11px] text-muted -mt-2">
        Flat delivery fee charged at checkout when the order is below the free-shipping threshold. Waived by a free-delivery coupon.
      </p>
      <fieldset className="space-y-3">
        <legend className="text-xs uppercase tracking-widest text-muted mb-2">Social links</legend>
        <p className="text-xs text-muted mb-3">
          Paste each profile URL (for WhatsApp use a <code>wa.me</code> link or a phone number).
          Toggle a social off to hide it everywhere — footer, contact page, and the floating WhatsApp button.
        </p>
        {SOCIAL_FIELDS.map(({ key, placeholder }) => {
          const on = socialVisible[key] !== false;
          return (
            <div key={key} className="flex items-end gap-3">
              <label className="block flex-1">
                <span className="block text-[11px] uppercase tracking-widest text-muted mb-1 capitalize">{key}</span>
                <input
                  className={inputClass}
                  value={socialLinks[key] ?? ''}
                  onChange={(e) => setSocial(key, e.target.value)}
                  placeholder={placeholder}
                />
              </label>
              <button
                type="button"
                onClick={() => setSocialVisible(key, !on)}
                aria-pressed={on}
                title={on ? 'Visible — click to hide' : 'Hidden — click to show'}
                className="shrink-0 inline-flex items-center gap-2 px-2.5 py-2 rounded-xl border border-stroke hover:border-accent/40 transition-colors"
              >
                <span className="relative inline-block">
                  <span className={['block w-9 h-5 rounded-full transition-colors', on ? 'bg-accent' : 'bg-stroke'].join(' ')} />
                  <span className={['absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', on ? 'translate-x-4' : ''].join(' ')} />
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${on ? 'text-ok' : 'text-muted'}`}>
                  {on ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          );
        })}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs uppercase tracking-widest text-muted mb-2">Homepage sections</legend>
        <p className="text-xs text-muted mb-3">
          Toggle storefront sections on or off without deleting their content. New sections default to visible.
        </p>
        {HOMEPAGE_SECTIONS.map(({ key, label, hint }) => {
          // Missing key in the map ⇒ visible. So we only turn the switch off
          // when the value is explicitly `false`.
          const visible = sectionsVisible[key] !== false;
          return (
            <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-stroke bg-surface-raised cursor-pointer hover:border-accent/40 transition-colors">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setSectionVisible(key, e.target.checked)}
                  className="sr-only"
                />
                <div className={[
                  'w-9 h-5 rounded-full transition-colors',
                  visible ? 'bg-accent' : 'bg-stroke',
                ].join(' ')} />
                <div className={[
                  'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  visible ? 'translate-x-4' : '',
                ].join(' ')} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-primary">{label}</p>
                <p className="text-xs text-muted mt-0.5">{hint}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${visible ? 'text-ok' : 'text-muted'}`}>
                {visible ? 'On' : 'Off'}
              </span>
            </label>
          );
        })}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
