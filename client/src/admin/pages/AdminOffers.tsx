import { useState, type ReactNode } from 'react';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { ImageUpload } from '../components/ImageUpload';
import type { HeroSlide, OfferBanner } from '../../types';

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
// Banner themes — simpler: just a color preset.
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
// Offers admin page — two sections: hero slides + offer banners.
// ─────────────────────────────────────────────────────────────────────────────

export function AdminOffers() {
  return (
    <div className="space-y-10">
      <HeroSlidesSection />
      <OfferBannersSection />
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
// Hero slides section
// ─────────────────────────────────────────────────────────────────────────────

function HeroSlidesSection() {
  const { items: slides, add, update, remove, reorder } = useUiContentSlot<Omit<HeroSlide, 'id'>>('hero-slide');
  const [editing,       setEditing]       = useState<HeroSlide | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HeroSlide | null>(null);

  const newSlide = (): HeroSlide => ({
    id:           `slide-${Date.now().toString(36)}`,
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

  const move = (id: string, dir: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= slides.length) return;
    const a = slides[idx];
    const b = slides[next];
    void Promise.all([reorder(a.id, b.sortOrder), reorder(b.id, a.sortOrder)]);
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

      <SlideEditor
        slide={editing}
        onCancel={() => setEditing(null)}
        onSave={(s) => {
          const exists = slides.some((existing) => existing.id === s.id);
          if (exists) update(s.id, s);
          else        add(s);
          setEditing(null);
        }}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete slide"
        message={pendingDelete ? `Remove this slide from the home carousel? "${pendingDelete.headline.replace(/\n/g, ' ')}"` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
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
      </div>
    </div>
  );
}

const editorInput = 'w-full px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

interface SlideEditorProps {
  slide:    HeroSlide | null;
  onCancel: () => void;
  onSave:   (slide: HeroSlide) => void;
}

function SlideEditor({ slide, onCancel, onSave }: SlideEditorProps) {
  const [form, setForm] = useState<HeroSlide | null>(slide);

  if (slide && (!form || form.id !== slide.id)) setForm(slide);
  if (!slide || !form) return null;

  const setField = <K extends keyof HeroSlide>(key: K, value: HeroSlide[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  };
  const applyTheme = (theme: SlideTheme) => {
    setForm((prev) => prev ? { ...prev, accent: theme.accent, align: theme.align, overlay: theme.overlay } : prev);
  };

  const currentTheme = findSlideTheme(form);

  return (
    <Modal isOpen={!!slide} onClose={onCancel} title="Slide editor" maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <SlidePreview slide={form} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Live preview</p>
        </div>

        <div className="lg:col-span-3 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Theme</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slideThemes.map((t) => {
                const active = currentTheme.id === t.id;
                return (
                  <button type="button" key={t.id} onClick={() => applyTheme(t)}
                    className={['relative text-left rounded-xl border-2 p-3 transition-all',
                      active ? 'border-accent' : 'border-gray-200 hover:border-gray-400'].join(' ')}>
                    <span className="block w-full h-6 rounded mb-2" style={{ backgroundColor: t.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">{t.name}</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.description}</span>
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

          <EditorField label="Headline" hint="Use a real newline for a line break">
            <textarea value={form.headline} onChange={(e) => setField('headline', e.target.value)}
              rows={2} className={`${editorInput} resize-y font-sport text-lg tracking-wide`} />
          </EditorField>

          <EditorField label="Sub-headline">
            <textarea value={form.subheadline} onChange={(e) => setField('subheadline', e.target.value)}
              rows={2} className={`${editorInput} resize-y`} />
          </EditorField>

          <EditorField label="Background image">
            <ImageUpload value={form.image} onChange={(url) => setField('image', url)} label="Upload background" />
          </EditorField>

          <div className="grid grid-cols-2 gap-3">
            <EditorField label="Badge (optional)">
              <input value={form.badge ?? ''} onChange={(e) => setField('badge', e.target.value)} className={editorInput} placeholder="Match Day" />
            </EditorField>
            <EditorField label="CTA label">
              <input value={form.ctaLabel} onChange={(e) => setField('ctaLabel', e.target.value)} className={editorInput} placeholder="Shop Now" />
            </EditorField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <EditorField label="CTA link">
              <input value={form.ctaHref} onChange={(e) => setField('ctaHref', e.target.value)} className={editorInput} placeholder="/shop" />
            </EditorField>
            <EditorField label="Alignment">
              <select value={form.align ?? 'left'} onChange={(e) => setField('align', e.target.value as HeroSlide['align'])} className={editorInput}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </EditorField>
          </div>

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

      <EditorFooter onCancel={onCancel} onSave={() => onSave(form)} />
    </Modal>
  );
}

function EditorFooter({ onCancel, onSave, label = 'Save' }: { onCancel: () => void; onSave: () => void; label?: string }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
      <button type="button" onClick={onCancel}
        className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
        Cancel
      </button>
      <button type="button" onClick={onSave}
        className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-sm uppercase tracking-wider border-2 border-accent hover:bg-black shadow-lg shadow-accent/30 transition-colors">
        {label}
      </button>
    </div>
  );
}

function EditorField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{label}</span>
        {hint && <span className="text-[10px] text-gray-500 normal-case">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer banners section — the rotating slab below the hero.
// ─────────────────────────────────────────────────────────────────────────────

function OfferBannersSection() {
  const { items: banners, add, update, remove, reorder } = useUiContentSlot<Omit<OfferBanner, 'id'>>('offer-banner');
  const [editing,       setEditing]       = useState<OfferBanner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OfferBanner | null>(null);

  const newBanner = (): OfferBanner => ({
    id:          `banner-${Date.now().toString(36)}`,
    label:       'New',
    headline:    'Headline',
    subheadline: 'Supporting line',
    ctaLabel:    'Shop Now',
    ctaHref:     '/shop',
    color:       bannerThemes[0].color,
    image:       '',
  });

  const move = (id: string, dir: -1 | 1) => {
    const idx = banners.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= banners.length) return;
    const a = banners[idx];
    const b = banners[next];
    void Promise.all([reorder(a.id, b.sortOrder), reorder(b.id, a.sortOrder)]);
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

      <BannerEditor
        banner={editing}
        onCancel={() => setEditing(null)}
        onSave={(b) => {
          const exists = banners.some((existing) => existing.id === b.id);
          if (exists) update(b.id, b);
          else        add(b);
          setEditing(null);
        }}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete banner"
        message={pendingDelete ? `Remove this banner? "${pendingDelete.headline}"` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
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
      </div>
    </div>
  );
}

interface BannerEditorProps {
  banner:   OfferBanner | null;
  onCancel: () => void;
  onSave:   (banner: OfferBanner) => void;
}

function BannerEditor({ banner, onCancel, onSave }: BannerEditorProps) {
  const [form, setForm] = useState<OfferBanner | null>(banner);

  if (banner && (!form || form.id !== banner.id)) setForm(banner);
  if (!banner || !form) return null;

  const setField = <K extends keyof OfferBanner>(key: K, value: OfferBanner[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  };
  const currentTheme = findBannerTheme(form);

  return (
    <Modal isOpen={!!banner} onClose={onCancel} title="Banner editor" maxWidth="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <BannerPreview banner={form} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Live preview</p>
        </div>

        <div className="lg:col-span-3 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Theme</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bannerThemes.map((t) => {
                const active = currentTheme.id === t.id;
                return (
                  <button type="button" key={t.id} onClick={() => setField('color', t.color)}
                    className={['relative text-left rounded-xl border-2 p-3 transition-all',
                      active ? 'border-accent' : 'border-gray-200 hover:border-gray-400'].join(' ')}>
                    <span className="block w-full h-6 rounded mb-2" style={{ backgroundColor: t.color }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">{t.name}</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.description}</span>
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
            <ImageUpload value={form.image} onChange={(url) => setField('image', url)} label="Upload background" />
          </EditorField>

          <div className="grid grid-cols-2 gap-3">
            <EditorField label="Label" hint="Short tag (Sale, New, etc.)">
              <input value={form.label} onChange={(e) => setField('label', e.target.value)} className={editorInput} placeholder="Sale" />
            </EditorField>
            <EditorField label="Headline">
              <input value={form.headline} onChange={(e) => setField('headline', e.target.value)} className={editorInput} placeholder="Up To 40% Off" />
            </EditorField>
          </div>

          <EditorField label="Sub-headline">
            <input value={form.subheadline} onChange={(e) => setField('subheadline', e.target.value)} className={editorInput} placeholder="On selected items" />
          </EditorField>

          <div className="grid grid-cols-2 gap-3">
            <EditorField label="CTA label">
              <input value={form.ctaLabel} onChange={(e) => setField('ctaLabel', e.target.value)} className={editorInput} placeholder="Shop Sale" />
            </EditorField>
            <EditorField label="CTA link">
              <input value={form.ctaHref} onChange={(e) => setField('ctaHref', e.target.value)} className={editorInput} placeholder="/shop?badge=Sale" />
            </EditorField>
          </div>
        </div>
      </div>

      <EditorFooter onCancel={onCancel} onSave={() => onSave(form)} />
    </Modal>
  );
}
