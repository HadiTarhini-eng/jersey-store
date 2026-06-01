import { useEffect, useState, type ReactNode } from 'react';
import { useUiContentSlot, type UseUiContentSlotResult } from '../../hooks/useUiContentSlot';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { ImageUpload } from '../components/ImageUpload';
import { useToast } from '../../components/ui/Toast';
import { extractErrorMessage } from '../../services/api/client';
import { formatPrice } from '../../utils/formatters';
import { ShopFilterPicker, buildShopUrl, parseShopUrl, type ShopFilterValue } from '../components/ShopFilterPicker';
import { adminApi } from '../services/adminApi';
import type { AdminCustomer, CouponPayload, HeroSlide, OfferBanner, ProductPerk } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Hero-slide themes
// ─────────────────────────────────────────────────────────────────────────────

interface SlideTheme {
  id:       string;
  name:     string;
  accent:   string;
  align:    'left' | 'center' | 'right';
  overlay:  'left' | 'right' | 'center' | 'bottom';
  description: string;
}

const slideThemes: SlideTheme[] = [
  { id: 'electric', name: 'Electric',  accent: '#007aff', align: 'left',   overlay: 'left',   description: 'Cool blue, stadium energy' },
  { id: 'gold',     name: 'Gold',      accent: '#ffd700', align: 'center', overlay: 'bottom', description: 'Trophy, heritage, ceremonial' },
  { id: 'amber',    name: 'Amber',     accent: '#ff9f0a', align: 'right',  overlay: 'right',  description: 'Warm, nostalgic, storytelling' },
  { id: 'raw',      name: 'Raw',       accent: '#ff4d00', align: 'left',   overlay: 'left',   description: 'Gritty orange, training, raw' },
  { id: 'neon',     name: 'Neon',      accent: '#af52de', align: 'right',  overlay: 'right',  description: 'Violet, lifestyle, urban' },
  { id: 'midnight', name: 'Midnight',  accent: '#5856d6', align: 'center', overlay: 'center', description: 'Deep indigo, late-night drops' },
  { id: 'kinetic',  name: 'Kinetic',   accent: '#34c759', align: 'left',   overlay: 'left',   description: 'Athletic green, fresh kits' },
  { id: 'crimson',  name: 'Crimson',   accent: '#ff2d55', align: 'right',  overlay: 'right',  description: 'High-energy red, sales' },
];

function findSlideTheme(slide: HeroSlide): SlideTheme {
  return (
    slideThemes.find((t) =>
      t.accent.toLowerCase() === (slide.accent ?? '').toLowerCase() &&
      t.align === slide.align &&
      t.overlay === slide.overlay
    ) ?? slideThemes[0]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner themes
// ─────────────────────────────────────────────────────────────────────────────

interface BannerTheme {
  id:    string;
  name:  string;
  color: string;
  description: string;
}

const bannerThemes: BannerTheme[] = [
  { id: 'electric', name: 'Electric', color: '#007aff', description: 'Cool blue — new arrivals' },
  { id: 'raw',      name: 'Raw',      color: '#ff4d00', description: 'Bold orange — sales' },
  { id: 'neon',     name: 'Neon',     color: '#af52de', description: 'Violet — limited editions' },
  { id: 'gold',     name: 'Gold',     color: '#ffd700', description: 'Premium, exclusive drops' },
  { id: 'kinetic',  name: 'Kinetic',  color: '#34c759', description: 'Fresh kits, drops' },
  { id: 'crimson',  name: 'Crimson',  color: '#ff2d55', description: 'High-energy, urgent' },
  { id: 'amber',    name: 'Amber',    color: '#ff9f0a', description: 'Warm, accessible' },
  { id: 'midnight', name: 'Midnight', color: '#5856d6', description: 'Indigo, late-night drops' },
];

function findBannerTheme(banner: OfferBanner): BannerTheme {
  return bannerThemes.find((t) => t.color.toLowerCase() === banner.color.toLowerCase()) ?? bannerThemes[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Page entry
// ─────────────────────────────────────────────────────────────────────────────

export function AdminOffers() {
  return (
    <div className="space-y-10">
      <HeroSlidesSection />
      <OfferBannersSection />
      <OfferStripSection />
      <ProductPerksSection />
      <CouponsSection />
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap pb-3 border-b border-stroke">
      <div>
        <h2 className="font-sport text-2xl tracking-wide text-primary uppercase">{title}</h2>
        <p className="text-sm text-secondary mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

const addButtonClass = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider border-2 border-accent hover:bg-accent-light transition-colors';

// ─────────────────────────────────────────────────────────────────────────────
// Shared reorder helper
// ─────────────────────────────────────────────────────────────────────────────

function useMove<T extends { id: string; sortOrder: number }>(items: T[], hook: UseUiContentSlotResult<any>, describe: string) {
  const { push } = useToast();
  return async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const a = items[idx];
    const b = items[next];
    try {
      await Promise.all([hook.reorder(a.id, b.sortOrder), hook.reorder(b.id, a.sortOrder)]);
    } catch (err) {
      push({ variant: 'error', message: extractErrorMessage(err, `Could not reorder ${describe}`) });
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero slides
// ─────────────────────────────────────────────────────────────────────────────

function HeroSlidesSection() {
  const hook = useUiContentSlot<Omit<HeroSlide, 'id'>>('hero-slide');
  const slides = hook.items;
  const [editing,       setEditing]       = useState<HeroSlide | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HeroSlide | null>(null);
  const { promise } = useToast();
  const move = useMove(slides, hook, 'slide');

  const newSlide = (): HeroSlide => ({
    id:           '', // server-assigned
    headline:     'New\nSlogan',
    subheadline:  'Supporting line — describe what this slide is about.',
    ctaLabel:     'Shop Now',
    ctaHref:      '/shop',
    image:        '',
    badge:        'New',
    accent:       slideThemes[0].accent,
    align:        slideThemes[0].align,
    overlay:      slideThemes[0].overlay,
  });

  const onSave = async (s: HeroSlide, file: File | null) => {
    const exists = !!s.id && slides.some((existing) => existing.id === s.id);
    const { id: _id, ...payload } = s;
    void _id;
    try {
      if (exists) {
        await promise(hook.update(s.id, payload), {
          success: 'Slide saved',
          error:   (err) => extractErrorMessage(err, 'Could not save slide'),
        });
        if (file) await hook.setImage(s.id, file);
      } else {
        await promise(hook.add(payload, file ?? undefined), {
          success: 'Slide added',
          error:   (err) => extractErrorMessage(err, 'Could not add slide'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: 'Slide deleted',
      error:   (err) => extractErrorMessage(err, 'Could not delete slide'),
    }).catch(() => undefined);
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Hero Slides"
        subtitle={`${slides.length} slide${slides.length !== 1 ? 's' : ''} — auto-rotates every 8s at the top of the homepage.`}
        action={
          <button type="button" onClick={() => setEditing(newSlide())} className={addButtonClass}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Slide
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {slides.map((slide, i) => {
          const theme = findSlideTheme(slide);
          return (
            <SlideCard
              key={slide.id}
              slide={slide}
              theme={theme}
              isFirst={i === 0}
              isLast={i === slides.length - 1}
              onEdit={() => setEditing(slide)}
              onDelete={() => setPendingDelete(slide)}
              onMoveUp={() => move(slide.id, -1)}
              onMoveDown={() => move(slide.id, 1)}
            />
          );
        })}
      </div>

      <SlideEditor slide={editing} onCancel={() => setEditing(null)} onSave={onSave} />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete slide"
        message={pendingDelete ? `Remove this slide from the home carousel? "${pendingDelete.headline.replace(/\n/g, ' ')}"` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </section>
  );
}

interface SlideCardProps {
  slide:      HeroSlide;
  theme:      SlideTheme;
  isFirst:    boolean;
  isLast:     boolean;
  onEdit:     () => void;
  onDelete:   () => void;
  onMoveUp:   () => void;
  onMoveDown: () => void;
}

function SlideCard({ slide, theme, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }: SlideCardProps) {
  return (
    <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
      <SlidePreview slide={slide} />

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
              style={{ color: theme.accent, backgroundColor: `${theme.accent}26`, borderColor: `${theme.accent}55` }}
            >
              {theme.name}
            </span>
            {slide.badge && <span className="text-[10px] uppercase tracking-widest text-muted">{slide.badge}</span>}
          </div>
          <ReorderArrows isFirst={isFirst} isLast={isLast} onUp={onMoveUp} onDown={onMoveDown} />
        </div>

        <p className="font-sport text-xl tracking-wide text-primary uppercase leading-tight whitespace-pre-line">
          {slide.headline}
        </p>
        <p className="text-xs text-secondary line-clamp-2">{slide.subheadline}</p>

        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function ReorderArrows({ isFirst, isLast, onUp, onDown }: { isFirst: boolean; isLast: boolean; onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onUp} disabled={isFirst} aria-label="Move up"
        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
      <button type="button" onClick={onDown} disabled={isLast} aria-label="Move down"
        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-raised transition-colors disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
    </div>
  );
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stroke">
      <button type="button" onClick={onDelete} aria-label="Delete"
        className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      </button>
      <button type="button" onClick={onEdit}
        className="px-4 py-2 rounded-lg bg-black text-white font-bold text-xs uppercase tracking-wider border-2 border-power hover:bg-black transition-colors">
        Edit
      </button>
    </div>
  );
}

function SlidePreview({ slide }: { slide: HeroSlide }) {
  const accent  = slide.accent  ?? '#007aff';
  const align   = slide.align   ?? 'left';
  const overlay = slide.overlay ?? 'left';

  const overlayCss = {
    left:   'linear-gradient(to right, rgba(8,9,10,0.95), rgba(8,9,10,0.7) 35%, transparent 70%)',
    right:  'linear-gradient(to left,  rgba(8,9,10,0.95), rgba(8,9,10,0.7) 35%, transparent 70%)',
    center: 'linear-gradient(to top,   rgba(8,9,10,0.9), rgba(8,9,10,0.5))',
    bottom: 'linear-gradient(to top,   rgba(8,9,10,0.92), rgba(8,9,10,0.55) 50%, transparent)',
  }[overlay];

  const alignCss = {
    left:   'items-start text-left',
    center: 'items-center text-center',
    right:  'items-end text-right',
  }[align];

  return (
    <div className="relative w-full aspect-[16/9] bg-cover bg-center bg-surface-raised" style={{ backgroundImage: slide.image ? `url(${slide.image})` : undefined }}>
      <div className="absolute inset-0" style={{ background: overlayCss }} />
      <div className={`absolute inset-0 flex flex-col justify-center px-5 py-5 ${alignCss}`}>
        {slide.badge && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border mb-1.5"
            style={{ color: accent, backgroundColor: `${accent}26`, borderColor: `${accent}55` }}
          >
            {slide.badge}
          </span>
        )}
        <p className="font-sport text-2xl tracking-wide uppercase leading-[0.9] max-w-[80%]"
          style={{ whiteSpace: 'pre-line', color: '#000', WebkitTextStroke: '1.5px #fff', paintOrder: 'stroke fill' }}>
          {slide.headline}
        </p>
        <div className="h-[2px] w-10 mt-1.5 mb-0.5" style={{ backgroundColor: accent }} />
        <p className="text-[10px] font-bold uppercase tracking-wider max-w-[70%] truncate"
          style={{ color: '#000', WebkitTextStroke: '0.5px #fff', paintOrder: 'stroke fill' }}>
          {slide.subheadline}
        </p>
        {slide.ctaLabel && (
          <span
            className="inline-flex items-center px-2.5 py-1 mt-2 rounded text-[9px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: accent }}
          >
            {slide.ctaLabel} →
          </span>
        )}
      </div>
    </div>
  );
}

// Dark-mode input style shared by every editor modal in this file. Kept as a
// constant so any visual tweak lands on every modal in one edit.
const editorInput = 'w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-stroke text-primary placeholder:text-muted text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';
const editorInputError = editorInput + ' border-danger ring-2 ring-danger/20';

interface SlideEditorProps {
  slide:    HeroSlide | null;
  onCancel: () => void;
  onSave:   (slide: HeroSlide, file: File | null) => void;
}

function SlideEditor({ slide, onCancel, onSave }: SlideEditorProps) {
  const [form, setForm] = useState<HeroSlide | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof HeroSlide, string>>>({});
  const [filter, setFilter] = useState<ShopFilterValue>({ type: 'none', value: '' });

  useEffect(() => {
    setForm(slide);
    setFile(null);
    setErrors({});
    setFilter(slide ? parseShopUrl(slide.ctaHref) : { type: 'none', value: '' });
  }, [slide]);

  if (!slide || !form) return null;

  const setField = <K extends keyof HeroSlide>(key: K, value: HeroSlide[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const applyTheme = (theme: SlideTheme) => {
    setForm((prev) => prev ? { ...prev, accent: theme.accent, align: theme.align, overlay: theme.overlay } : prev);
  };

  const submit = () => {
    const errs: Partial<Record<keyof HeroSlide, string>> = {};
    if (!form.headline.trim())    errs.headline = 'Required';
    if (!form.subheadline.trim()) errs.subheadline = 'Required';
    if (!form.ctaLabel.trim())    errs.ctaLabel = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    // Build the CTA href from the filter picker — the legacy free-text field
    // is gone, but `ctaHref` on the wire keeps its meaning.
    onSave({ ...form, ctaHref: buildShopUrl(filter) }, file);
  };

  const currentTheme = findSlideTheme(form);

  return (
    <Modal isOpen={!!slide} onClose={onCancel} title="Slide editor" maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-stroke">
            <SlidePreview slide={form} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Live preview · CTA links to <span className="font-mono text-secondary">{buildShopUrl(filter)}</span></p>
        </div>

        <div className="lg:col-span-3 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Theme</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slideThemes.map((t) => {
                const active = currentTheme.id === t.id;
                return (
                  <button type="button" key={t.id} onClick={() => applyTheme(t)}
                    className={['relative text-left rounded-xl border-2 p-3 transition-all',
                      active ? 'border-accent bg-accent/10' : 'border-stroke hover:border-white/40'].join(' ')}>
                    <span className="block w-full h-6 rounded mb-2" style={{ backgroundColor: t.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.name}</span>
                    <span className="block text-[10px] text-muted mt-0.5 line-clamp-1">{t.description}</span>
                    {active && (
                      <svg className="absolute top-1.5 right-1.5 w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <EditorField label="Headline" hint="Use a real newline for a line break" error={errors.headline} required>
            <textarea value={form.headline} onChange={(e) => setField('headline', e.target.value)}
              rows={2} className={`${errors.headline ? editorInputError : editorInput} resize-y font-sport text-lg tracking-wide`} />
          </EditorField>

          <EditorField label="Sub-headline" error={errors.subheadline} required>
            <textarea value={form.subheadline} onChange={(e) => setField('subheadline', e.target.value)}
              rows={2} className={`${errors.subheadline ? editorInputError : editorInput} resize-y`} />
          </EditorField>

          <EditorField label="Background image">
            <ImageUpload
              value={form.image}
              onChange={(url, picked) => { setField('image', url); setFile(picked); }}
              label="Upload background"
            />
          </EditorField>

          <div className="grid grid-cols-2 gap-3">
            <EditorField label="Badge (optional)">
              <input value={form.badge ?? ''} onChange={(e) => setField('badge', e.target.value)} className={editorInput} placeholder="Match Day" />
            </EditorField>
            <EditorField label="CTA label" error={errors.ctaLabel} required>
              <input value={form.ctaLabel} onChange={(e) => setField('ctaLabel', e.target.value)} className={errors.ctaLabel ? editorInputError : editorInput} placeholder="Shop Now" />
            </EditorField>
          </div>

          <EditorField label="CTA destination" hint="What filter the button sends shoppers to.">
            <ShopFilterPicker value={filter} onChange={setFilter} inputClass={editorInput} />
          </EditorField>

          <EditorField label="Alignment">
            <select value={form.align ?? 'left'} onChange={(e) => setField('align', e.target.value as HeroSlide['align'])} className={editorInput}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </EditorField>

          <EditorField label="Overlay anchor">
            <select value={form.overlay ?? 'left'} onChange={(e) => setField('overlay', e.target.value as HeroSlide['overlay'])} className={editorInput}>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </EditorField>
        </div>
      </div>

      <EditorFooter onCancel={onCancel} onSave={submit} />
    </Modal>
  );
}

function EditorFooter({ onCancel, onSave, label = 'Save' }: { onCancel: () => void; onSave: () => void; label?: string }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stroke">
      <button type="button" onClick={onCancel}
        className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-muted hover:text-primary hover:bg-surface-raised transition-colors">
        Cancel
      </button>
      <button type="button" onClick={onSave}
        className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-sm uppercase tracking-wider border-2 border-accent hover:bg-black shadow-lg shadow-accent/30 transition-colors">
        {label}
      </button>
    </div>
  );
}

function EditorField({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </span>
        {hint && !error && <span className="text-[10px] text-muted normal-case">{hint}</span>}
        {error && <span className="text-[10px] text-danger normal-case">{error}</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer banners
// ─────────────────────────────────────────────────────────────────────────────

function OfferBannersSection() {
  const hook = useUiContentSlot<Omit<OfferBanner, 'id'>>('offer-banner');
  const banners = hook.items;
  const [editing,       setEditing]       = useState<OfferBanner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OfferBanner | null>(null);
  const { promise } = useToast();
  const move = useMove(banners, hook, 'banner');

  const newBanner = (): OfferBanner => ({
    id:          '',
    label:       'New',
    headline:    'Headline',
    subheadline: 'Supporting line',
    ctaLabel:    'Shop Now',
    ctaHref:     '/shop',
    color:       bannerThemes[0].color,
    image:       '',
  });

  const onSave = async (b: OfferBanner, file: File | null) => {
    const exists = !!b.id && banners.some((existing) => existing.id === b.id);
    const { id: _id, ...payload } = b;
    void _id;
    try {
      if (exists) {
        await promise(hook.update(b.id, payload), {
          success: 'Banner saved',
          error:   (err) => extractErrorMessage(err, 'Could not save banner'),
        });
        if (file) await hook.setImage(b.id, file);
      } else {
        await promise(hook.add(payload, file ?? undefined), {
          success: 'Banner added',
          error:   (err) => extractErrorMessage(err, 'Could not add banner'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: 'Banner deleted',
      error:   (err) => extractErrorMessage(err, 'Could not delete banner'),
    }).catch(() => undefined);
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Offer Banners"
        subtitle={`${banners.length} banner${banners.length !== 1 ? 's' : ''} — rotates every 4s below the hero.`}
        action={
          <button type="button" onClick={() => setEditing(newBanner())} className={addButtonClass}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Banner
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {banners.map((banner, i) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            theme={findBannerTheme(banner)}
            isFirst={i === 0}
            isLast={i === banners.length - 1}
            onEdit={() => setEditing(banner)}
            onDelete={() => setPendingDelete(banner)}
            onMoveUp={() => move(banner.id, -1)}
            onMoveDown={() => move(banner.id, 1)}
          />
        ))}
      </div>

      <BannerEditor banner={editing} onCancel={() => setEditing(null)} onSave={onSave} />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete banner"
        message={pendingDelete ? `Remove this banner? "${pendingDelete.headline}"` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </section>
  );
}

interface BannerCardProps {
  banner:     OfferBanner;
  theme:      BannerTheme;
  isFirst:    boolean;
  isLast:     boolean;
  onEdit:     () => void;
  onDelete:   () => void;
  onMoveUp:   () => void;
  onMoveDown: () => void;
}

function BannerCard({ banner, theme, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }: BannerCardProps) {
  return (
    <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
      <BannerPreview banner={banner} />

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
            style={{ color: theme.color, backgroundColor: `${theme.color}26`, borderColor: `${theme.color}55` }}>
            {theme.name}
          </span>
          <ReorderArrows isFirst={isFirst} isLast={isLast} onUp={onMoveUp} onDown={onMoveDown} />
        </div>

        <p className="text-sm font-bold uppercase tracking-wider text-primary line-clamp-1">{banner.headline}</p>
        <p className="text-xs text-secondary line-clamp-1">{banner.subheadline}</p>

        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function BannerPreview({ banner }: { banner: OfferBanner }) {
  return (
    <div className="relative w-full aspect-[3/1] bg-cover bg-center bg-surface-raised" style={{ backgroundImage: banner.image ? `url(${banner.image})` : undefined }}>
      <div className="absolute inset-0" style={{ backgroundColor: `${banner.color}99` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      <div className="relative h-full flex flex-col justify-center px-5">
        <span className="inline-block self-start mb-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest text-white"
          style={{ backgroundColor: banner.color }}>
          {banner.label}
        </span>
        <p className="font-sport text-xl tracking-wide text-primary uppercase leading-none">{banner.headline}</p>
        <p className="text-[10px] text-secondary mt-0.5 line-clamp-1">{banner.subheadline}</p>
        {/* CTA button removed — the whole banner is now clickable. */}
      </div>
    </div>
  );
}

interface BannerEditorProps {
  banner:   OfferBanner | null;
  onCancel: () => void;
  onSave:   (banner: OfferBanner, file: File | null) => void;
}

function BannerEditor({ banner, onCancel, onSave }: BannerEditorProps) {
  const [form, setForm] = useState<OfferBanner | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof OfferBanner, string>>>({});
  const [filter, setFilter] = useState<ShopFilterValue>({ type: 'none', value: '' });

  useEffect(() => {
    setForm(banner);
    setFile(null);
    setErrors({});
    setFilter(banner ? parseShopUrl(banner.ctaHref) : { type: 'none', value: '' });
  }, [banner]);

  if (!banner || !form) return null;

  const setField = <K extends keyof OfferBanner>(key: K, value: OfferBanner[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = () => {
    const errs: Partial<Record<keyof OfferBanner, string>> = {};
    if (!form.label.trim())     errs.label = 'Required';
    if (!form.headline.trim())  errs.headline = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // The banner no longer renders a CTA button — the whole tile is clickable.
    // We persist a derived URL into `ctaHref` (for back-compat) and clear the
    // legacy `ctaLabel` so old data doesn't keep rendering a stale chip.
    const next: OfferBanner = {
      ...form,
      ctaLabel: '',
      ctaHref:  buildShopUrl(filter),
    };
    onSave(next, file);
  };

  const currentTheme = findBannerTheme(form);

  return (
    <Modal isOpen={!!banner} onClose={onCancel} title="Banner editor" maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-stroke">
            <BannerPreview banner={form} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted">Live preview · clicking the banner sends shoppers to <span className="font-mono text-secondary">{buildShopUrl(filter)}</span></p>
        </div>

        <div className="lg:col-span-3 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Theme</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bannerThemes.map((t) => {
                const active = currentTheme.id === t.id;
                return (
                  <button type="button" key={t.id} onClick={() => setField('color', t.color)}
                    className={['relative text-left rounded-xl border-2 p-3 transition-all',
                      active ? 'border-accent bg-accent/10' : 'border-stroke hover:border-white/40'].join(' ')}>
                    <span className="block w-full h-6 rounded mb-2" style={{ backgroundColor: t.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.name}</span>
                    <span className="block text-[10px] text-muted mt-0.5 line-clamp-1">{t.description}</span>
                    {active && (
                      <svg className="absolute top-1.5 right-1.5 w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <EditorField label="Background image">
            <ImageUpload
              value={form.image}
              onChange={(url, picked) => { setField('image', url); setFile(picked); }}
              label="Upload background"
            />
          </EditorField>

          <div className="grid grid-cols-2 gap-3">
            <EditorField label="Label" hint="Short tag (Sale, New, etc.)" error={errors.label} required>
              <input value={form.label} onChange={(e) => setField('label', e.target.value)} className={errors.label ? editorInputError : editorInput} placeholder="Sale" />
            </EditorField>
            <EditorField label="Headline" error={errors.headline} required>
              <input value={form.headline} onChange={(e) => setField('headline', e.target.value)} className={errors.headline ? editorInputError : editorInput} placeholder="Up To 40% Off" />
            </EditorField>
          </div>

          <EditorField label="Sub-headline">
            <input value={form.subheadline} onChange={(e) => setField('subheadline', e.target.value)} className={editorInput} placeholder="On selected items" />
          </EditorField>

          <EditorField label="Where does it link to?" hint="The whole banner is clickable — pick the shop filter shoppers should land on.">
            <ShopFilterPicker value={filter} onChange={setFilter} inputClass={editorInput} />
          </EditorField>
        </div>
      </div>

      <EditorFooter onCancel={onCancel} onSave={submit} />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer strip — short marquee lines under the hero
// ─────────────────────────────────────────────────────────────────────────────

interface OfferStripPayload extends Record<string, unknown> {
  text: string;
}

function OfferStripSection() {
  const hook = useUiContentSlot<OfferStripPayload>('offer-strip');
  const items = hook.items;
  const [editing,       setEditing]       = useState<{ id: string; text: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; text: string } | null>(null);
  const [draft,         setDraft]         = useState('');
  const { promise } = useToast();
  const move = useMove(items, hook, 'strip item');

  const addItem = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      await promise(hook.add({ text }), {
        success: 'Strip item added',
        error:   (err) => extractErrorMessage(err, 'Could not add item'),
      });
      setDraft('');
    } catch { /* toast shown */ }
  };

  const onSave = async (id: string, text: string) => {
    try {
      await promise(hook.update(id, { text: text.trim() }), {
        success: 'Strip item saved',
        error:   (err) => extractErrorMessage(err, 'Could not save item'),
      });
      setEditing(null);
    } catch { /* toast shown */ }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: 'Strip item deleted',
      error:   (err) => extractErrorMessage(err, 'Could not delete item'),
    }).catch(() => undefined);
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Offer Strip"
        subtitle={`${items.length} message${items.length !== 1 ? 's' : ''} — scrolls below the hero. Keep each line short and punchy.`}
        action={null}
      />

      {/* Quick add */}
      <div className="flex items-center gap-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder="Free shipping on orders over $75"
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-stroke text-primary placeholder:text-muted text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!draft.trim()}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-wider border-2 border-accent hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </div>

      {/* Live strip preview */}
      {items.length > 0 && (
        <div className="rounded-xl border border-stroke overflow-hidden bg-surface-raised">
          <div className="overflow-hidden h-10">
            <div className="flex items-center h-full">
              <div className="marquee-track" style={{ animationDuration: '24s' }}>
                {[...items, ...items].map((it, i) => (
                  <span key={`${it.id}-${i}`} className="flex items-center shrink-0">
                    <span className="text-secondary text-xs px-5">{it.text}</span>
                    <span className="text-muted text-xs" aria-hidden="true">·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editable list */}
      <ul className="space-y-2">
        {items.map((it, i) => {
          const isEditing = editing?.id === it.id;
          return (
            <li
              key={it.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stroke bg-surface"
            >
              <ReorderArrows
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onUp={() => move(it.id, -1)}
                onDown={() => move(it.id, 1)}
              />
              {isEditing ? (
                <input
                  autoFocus
                  value={editing.text}
                  onChange={(e) => setEditing({ id: editing.id, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); onSave(editing.id, editing.text); }
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-raised border border-accent text-primary text-sm outline-none"
                />
              ) : (
                <span className="flex-1 text-sm text-primary truncate">{it.text}</span>
              )}
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => onSave(editing.id, editing.text)}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-3 py-1.5 rounded-lg text-muted hover:text-primary text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing({ id: it.id, text: it.text })}
                    className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-wider border-2 border-power hover:bg-black transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete({ id: it.id, text: it.text })}
                    aria-label="Delete"
                    className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                  </button>
                </>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="px-4 py-6 rounded-xl border border-dashed border-stroke text-center text-sm text-muted">
            No strip messages yet. Add your first one above.
          </li>
        )}
      </ul>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete strip item"
        message={pendingDelete ? `Remove this message? "${pendingDelete.text}"` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Coupons & gift cards
// ─────────────────────────────────────────────────────────────────────────────

interface CouponRowDraft {
  code:                string;
  discountType:        'percentage' | 'fixed' | 'free_shipping';
  discountValue:       string;
  description:         string;
  /** Blank = no cap. Any positive integer caps how many *items* a single user can redeem this coupon against across all their orders. */
  itemsAllowedPerUser: string;
  /** Blank = no cap. Free-shipping coupons: caps how many *orders* a single user can use it on. */
  ordersAllowedPerUser: string;
  /** Empty = available to every signed-in customer. Non-empty = only these customer ids. */
  allowedUserIds:      string[];
}

const emptyDraft: CouponRowDraft = {
  code: '', discountType: 'percentage', discountValue: '', description: '', itemsAllowedPerUser: '', ordersAllowedPerUser: '', allowedUserIds: [],
};

/**
 * Searchable checkbox list of customers used to build a coupon's allowlist.
 * Empty selection means "every signed-in customer"; any selection narrows
 * redemption to those accounts only.
 */
function CustomerAllowlistPicker({
  customers, selected, onChange,
}: {
  customers: AdminCustomer[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) => `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q))
    : customers;

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers by name or email…"
          className={editorInput}
        />
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors"
          >
            Clear ({selected.length})
          </button>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto hide-scrollbar rounded-xl border border-stroke divide-y divide-stroke">
        {customers.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted">No customers available.</p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted">No matches for “{query}”.</p>
        ) : (
          filtered.map((c) => (
            <label key={c.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-raised transition-colors">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="w-4 h-4 rounded border-stroke bg-surface-raised text-accent focus:ring-accent"
              />
              <span className="min-w-0">
                <span className="block text-sm text-primary truncate">{c.firstName} {c.lastName}</span>
                <span className="block text-[11px] text-muted truncate">{c.email}</span>
              </span>
            </label>
          ))
        )}
      </div>
      <p className="text-[10px] text-muted">
        {selected.length === 0
          ? 'Available to every signed-in customer.'
          : `Only ${selected.length} selected customer${selected.length === 1 ? '' : 's'} can redeem this coupon.`}
      </p>
    </div>
  );
}

function CouponsSection() {
  const hook = useUiContentSlot<CouponPayload>('coupon');
  const items = hook.items;
  const [editing, setEditing] = useState<{ id: string | null; draft: CouponRowDraft } | null>(null);
  // Customer roster — powers the optional per-coupon allowlist picker. Loaded
  // once per section mount; failures leave the list empty (picker shows none).
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  useEffect(() => {
    let cancelled = false;
    adminApi.listCustomers()
      .then((rows) => { if (!cancelled) setCustomers(rows); })
      .catch(() => { /* leave empty if unavailable */ });
    return () => { cancelled = true; };
  }, []);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; code: string } | null>(null);
  const { promise } = useToast();

  const onSave = async () => {
    if (!editing) return;
    const code  = editing.draft.code.trim().toUpperCase();
    if (!code) return;
    const freeShipping = editing.draft.discountType === 'free_shipping';

    // Discount value only applies to percentage/fixed coupons; free-shipping
    // stores 0.
    let value = 0;
    if (!freeShipping) {
      value = Number(editing.draft.discountValue);
      if (!Number.isFinite(value) || value <= 0) return;
    }

    // Parse the optional per-user caps. Blank ⇒ no cap (null). Non-positive
    // values are rejected so the admin can't save "0" and lock everyone out.
    const parseCap = (raw: string): number | null | false => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const n = Number(trimmed);
      return Number.isFinite(n) && Number.isInteger(n) && n >= 1 ? n : false;
    };
    const itemsAllowedPerUser  = freeShipping ? null : parseCap(editing.draft.itemsAllowedPerUser);
    const ordersAllowedPerUser = freeShipping ? parseCap(editing.draft.ordersAllowedPerUser) : null;
    if (itemsAllowedPerUser === false || ordersAllowedPerUser === false) return; // invalid cap

    const payload: CouponPayload = {
      code,
      discountType:  editing.draft.discountType,
      discountValue: value,
      description:   editing.draft.description.trim() || undefined,
      itemsAllowedPerUser,
      ordersAllowedPerUser,
      // Empty selection ⇒ no restriction (available to every signed-in customer).
      allowedUserIds: editing.draft.allowedUserIds.length > 0 ? editing.draft.allowedUserIds : undefined,
    };
    try {
      if (editing.id) {
        await promise(hook.update(editing.id, payload), {
          success: `${code} saved`,
          error:   (err) => extractErrorMessage(err, 'Could not save coupon'),
        });
      } else {
        await promise(hook.add(payload), {
          success: `${code} created`,
          error:   (err) => extractErrorMessage(err, 'Could not create coupon'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: `${target.code} deleted`,
      error:   (err) => extractErrorMessage(err, 'Could not delete coupon'),
    }).catch(() => undefined);
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Coupons / Gift cards"
        subtitle={`${items.length} code${items.length !== 1 ? 's' : ''} — customers redeem these on the checkout review step.`}
        action={
          <button
            type="button"
            onClick={() => setEditing({ id: null, draft: { ...emptyDraft } })}
            className={addButtonClass}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Coupon
          </button>
        }
      />

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="px-4 py-6 rounded-xl border border-dashed border-stroke text-center text-sm text-muted">
            No coupons yet. Customers can&apos;t redeem anything until you add one.
          </div>
        )}
        {items.map((c) => {
          const valueLabel = c.discountType === 'free_shipping'
            ? 'Free delivery'
            : c.discountType === 'percentage'
              ? `${c.discountValue}% off`
              : `${formatPrice(c.discountValue)} off`;
          return (
            <div
              key={c.id}
              className={['flex items-center gap-3 px-4 py-3 rounded-xl border border-stroke bg-surface', !c.isActive && 'opacity-60'].filter(Boolean).join(' ')}
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-primary tracking-wider flex items-center gap-2">
                  {c.code}
                  {c.itemsAllowedPerUser != null && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-accent/15 text-accent border border-accent/30">
                      Max {c.itemsAllowedPerUser} item{c.itemsAllowedPerUser === 1 ? '' : 's'}/user
                    </span>
                  )}
                  {c.allowedUserIds && c.allowedUserIds.length > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-power/15 text-power border border-power/30">
                      {c.allowedUserIds.length} customer{c.allowedUserIds.length === 1 ? '' : 's'} only
                    </span>
                  )}
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  <span className="text-ok font-semibold">{valueLabel}</span>
                  {c.description && <span className="text-muted"> · {c.description}</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    id: c.id,
                    draft: {
                      code:                c.code,
                      discountType:        c.discountType,
                      discountValue:       String(c.discountValue),
                      description:         c.description ?? '',
                      itemsAllowedPerUser: c.itemsAllowedPerUser != null ? String(c.itemsAllowedPerUser) : '',
                      ordersAllowedPerUser: c.ordersAllowedPerUser != null ? String(c.ordersAllowedPerUser) : '',
                      allowedUserIds:      c.allowedUserIds ?? [],
                    },
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-wider border-2 border-power hover:bg-black transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete({ id: c.id, code: c.code })}
                aria-label="Delete"
                className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit coupon' : 'New coupon'} maxWidth="max-w-lg">
        {editing && (
          <div className="space-y-4">
            <EditorField label="Code" hint="Customer types this on checkout — letters/numbers, auto-uppercased" required>
              <input
                value={editing.draft.code}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, code: e.target.value.toUpperCase() } })}
                placeholder="WELCOME10"
                className={editorInput + ' font-mono tracking-wider uppercase'}
              />
            </EditorField>
            <div className="grid grid-cols-2 gap-3">
              <EditorField label="Discount type" required>
                <select
                  value={editing.draft.discountType}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, discountType: e.target.value as CouponPayload['discountType'] } })}
                  className={editorInput}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_shipping">Free delivery</option>
                </select>
              </EditorField>
              {editing.draft.discountType !== 'free_shipping' && (
                <EditorField
                  label={editing.draft.discountType === 'percentage' ? 'Discount %' : 'Discount amount'}
                  required
                >
                  <input
                    type="number"
                    min="0"
                    step={editing.draft.discountType === 'percentage' ? '1' : '0.01'}
                    value={editing.draft.discountValue}
                    onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, discountValue: e.target.value } })}
                    placeholder={editing.draft.discountType === 'percentage' ? '10' : '15.00'}
                    className={editorInput}
                  />
                </EditorField>
              )}
            </div>
            <EditorField label="Description (optional)" hint="Shown to admins only — won't appear to customers">
              <input
                value={editing.draft.description}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, description: e.target.value } })}
                placeholder="Welcome offer for newsletter subscribers"
                className={editorInput}
              />
            </EditorField>
            {editing.draft.discountType === 'free_shipping' ? (
              <EditorField
                label="Orders allowed per user (optional)"
                hint="How many separate orders a single signed-in customer can use this free-delivery coupon on. Leave blank for no limit."
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editing.draft.ordersAllowedPerUser}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, ordersAllowedPerUser: e.target.value } })}
                  placeholder="e.g. 1 — one free-delivery order per customer"
                  className={editorInput}
                />
              </EditorField>
            ) : (
              <EditorField
                label="Items allowed per user (optional)"
                hint="Total items a single signed-in customer can apply this coupon to across all orders (a cap of 7 lets them redeem 5 now and 2 later). Leave blank for no cap."
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editing.draft.itemsAllowedPerUser}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, itemsAllowedPerUser: e.target.value } })}
                  placeholder="e.g. 7 — redeemable on 7 items total per user"
                  className={editorInput}
                />
              </EditorField>
            )}
            <EditorField
              label="Restrict to specific customers (optional)"
              hint="Leave empty so any signed-in customer can redeem it. Pick customers to limit redemption to those accounts only. Coupons always require sign-in."
            >
              <CustomerAllowlistPicker
                customers={customers}
                selected={editing.draft.allowedUserIds}
                onChange={(ids) => setEditing({ ...editing, draft: { ...editing.draft, allowedUserIds: ids } })}
              />
            </EditorField>
          </div>
        )}
        <EditorFooter onCancel={() => setEditing(null)} onSave={onSave} />
      </Modal>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete coupon"
        message={pendingDelete ? `Remove coupon "${pendingDelete.code}"? Customers who try to use it will get an invalid-code error.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product perks — trust badges under Add-to-Cart on every product page
// ─────────────────────────────────────────────────────────────────────────────

interface PerkDraft { icon: string; label: string; detail: string }
const emptyPerk: PerkDraft = { icon: '🚚', label: '', detail: '' };

function ProductPerksSection() {
  const hook = useUiContentSlot<ProductPerk>('product-perk');
  const items = hook.items;
  const [editing, setEditing] = useState<{ id: string | null; draft: PerkDraft } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
  const { push, promise } = useToast();
  const move = useMove(items, hook, 'perk');

  const onSave = async () => {
    if (!editing) return;
    const label = editing.draft.label.trim();
    if (!label) return;
    const payload: ProductPerk = {
      icon:   editing.draft.icon.trim() || '⭐',
      label,
      detail: editing.draft.detail.trim(),
    };
    try {
      if (editing.id) {
        await promise(hook.update(editing.id, payload), {
          success: `${label} saved`,
          error:   (err) => extractErrorMessage(err, 'Could not save perk'),
        });
      } else {
        await promise(hook.add(payload), {
          success: `${label} created`,
          error:   (err) => extractErrorMessage(err, 'Could not create perk'),
        });
      }
      setEditing(null);
    } catch { /* toast already shown */ }
  };

  const onToggle = async (p: ProductPerk & { id: string; isActive: boolean }) => {
    try {
      await hook.setActive(p.id, !p.isActive);
      push({ variant: 'success', message: `${p.label} ${p.isActive ? 'hidden' : 'shown'}` });
    } catch (err) {
      push({ variant: 'error', message: extractErrorMessage(err, 'Could not toggle perk') });
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    await promise(hook.remove(target.id), {
      success: `${target.label} deleted`,
      error:   (err) => extractErrorMessage(err, 'Could not delete perk'),
    }).catch(() => undefined);
  };

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Product Perks"
        subtitle="Trust badges shown under the Add-to-Cart button on every product page. Leave empty to fall back to defaults."
        action={
          <button type="button" onClick={() => setEditing({ id: null, draft: { ...emptyPerk } })} className={addButtonClass}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Perk
          </button>
        }
      />

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="px-4 py-6 rounded-xl border border-dashed border-stroke text-center text-sm text-muted">
            No perks set — the product page shows default badges (Free shipping, Returns, Authentic).
          </div>
        )}
        {items.map((p, idx) => (
          <div
            key={p.id}
            className={['flex items-center gap-3 px-4 py-3 rounded-xl border border-stroke bg-surface', !p.isActive && 'opacity-60'].filter(Boolean).join(' ')}
          >
            <span className="text-xl shrink-0" aria-hidden="true">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary truncate">{p.label}</p>
              {p.detail && <p className="text-xs text-secondary truncate">{p.detail}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => move(p.id, -1)} disabled={idx === 0} aria-label="Move up"
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">↑</button>
              <button type="button" onClick={() => move(p.id, 1)} disabled={idx === items.length - 1} aria-label="Move down"
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">↓</button>
              <button
                type="button"
                onClick={() => onToggle(p)}
                className={[
                  'ml-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-colors',
                  p.isActive ? 'border-delivered/40 text-delivered hover:bg-delivered/10' : 'border-stroke text-muted hover:text-primary hover:border-white/50',
                ].join(' ')}
              >
                {p.isActive ? 'Shown' : 'Hidden'}
              </button>
              <button
                type="button"
                onClick={() => setEditing({ id: p.id, draft: { icon: p.icon, label: p.label, detail: p.detail } })}
                className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold uppercase tracking-wider border-2 border-power hover:bg-black transition-colors"
              >
                Edit
              </button>
              <button type="button" onClick={() => setPendingDelete({ id: p.id, label: p.label })} aria-label="Delete"
                className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit perk' : 'New perk'} maxWidth="max-w-md">
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
              <EditorField label="Icon">
                <input
                  value={editing.draft.icon}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, icon: e.target.value } })}
                  className={editorInput + ' w-20 text-center text-lg'}
                  maxLength={4}
                  placeholder="🚚"
                />
              </EditorField>
              <EditorField label="Label" required>
                <input
                  value={editing.draft.label}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, label: e.target.value } })}
                  className={editorInput}
                  placeholder="Free shipping"
                />
              </EditorField>
            </div>
            <EditorField label="Detail" hint="Short supporting line shown under the label">
              <input
                value={editing.draft.detail}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, detail: e.target.value } })}
                className={editorInput}
                placeholder="On orders over $75"
              />
            </EditorField>
          </div>
        )}
        <EditorFooter onCancel={() => setEditing(null)} onSave={onSave} />
      </Modal>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete perk"
        message={pendingDelete ? `Remove "${pendingDelete.label}" from product pages?` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={onDelete}
      />
    </section>
  );
}
