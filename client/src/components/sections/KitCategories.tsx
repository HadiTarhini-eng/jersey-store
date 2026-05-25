import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import type { UiCategory } from '../../types';

/**
 * Vibrant palette used when an admin-managed category hasn't supplied its own
 * `color`. Cycles by index so adjacent tiles always read distinct, matching
 * the punchy palette of the offers banner.
 */
const VIBRANT_PALETTE = [
  { color: '#ff4d00', dark: '#9c2e00' }, // power orange
  { color: '#007aff', dark: '#003d80' }, // accent blue
  { color: '#af52de', dark: '#5a2877' }, // purple
  { color: '#34c759', dark: '#1a6b30' }, // green
  { color: '#ff2d55', dark: '#8a1530' }, // hot pink
  { color: '#ffd60a', dark: '#7a6500' }, // yellow
];

function paletteFor(index: number, cat: UiCategory) {
  const fallback = VIBRANT_PALETTE[index % VIBRANT_PALETTE.length];
  return {
    color: cat.color ?? fallback.color,
    dark:  cat.colorDark ?? fallback.dark,
  };
}

export function KitCategories() {
  const { items: categories } = useUiContentSlot<Omit<UiCategory, 'id'>>('kit-category', { activeOnly: true });

  if (categories.length === 0) return null;

  return (
    <section className="py-6 md:py-8 w-full">
      {/* Section header */}
      <div className="mb-6">
        <h2 className={theme.sectionTitle}>Shop by Category</h2>
        <p className={theme.sectionSubtitle}>Every piece of kit you need, in one place</p>
      </div>

      {/* ── Desktop: horizontal accordion ───────────────────────────────────── */}
      <DesktopAccordion categories={categories} />

      {/* ── Mobile: stacked tiles ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {categories.map((cat, i) => (
          <MobileTile key={cat.id} category={cat} palette={paletteFor(i, cat)} />
        ))}
      </div>
    </section>
  );
}

// ── Desktop accordion ────────────────────────────────────────────────────────

function DesktopAccordion({ categories }: { categories: UiCategory[] }) {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <div className="hidden md:flex gap-2 h-[440px] w-full">
      {categories.map((cat, i) => {
        const expanded = hoveredId === cat.id;
        const shrunk   = hoveredId !== null && !expanded;
        const palette  = paletteFor(i, cat);

        return (
          <Link
            key={cat.id}
            to={`/shop?categoryId=${cat.productCategoryId ?? cat.id}`}
            onMouseEnter={() => setHoveredId(cat.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative overflow-hidden rounded-2xl group cursor-pointer"
            style={{
              flex: expanded ? '3.2 1 0%' : shrunk ? '0.7 1 0%' : '1 1 0%',
              transition: 'flex 700ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 500ms ease',
              boxShadow: expanded ? `0 18px 50px -10px ${palette.color}80` : 'none',
            }}
          >
            {/* Background image */}
            {cat.image && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${cat.image})`,
                  transform: expanded ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            )}

            {/* Vibrant gradient overlay — vertical color wash from bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top,
                  ${palette.dark}f5 0%,
                  ${palette.color}88 45%,
                  ${palette.color}22 75%,
                  transparent 100%)`,
                opacity: expanded ? 1 : 0.85,
                transition: 'opacity 500ms ease',
              }}
            />

            {/* Diagonal color slash — appears more strongly when expanded */}
            <div
              className="absolute -right-20 -top-10 w-72 h-72 rounded-full blur-3xl mix-blend-screen"
              style={{
                backgroundColor: palette.color,
                opacity: expanded ? 0.55 : 0.2,
                transition: 'opacity 600ms ease',
              }}
            />

            {/* Color accent bar — slides up on hover */}
            <div
              className="absolute inset-x-0 bottom-0 h-1.5"
              style={{
                backgroundColor: palette.color,
                transform: expanded ? 'scaleX(1)' : 'scaleX(0.2)',
                transformOrigin: 'left',
                transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              <p className="font-sport text-3xl lg:text-4xl tracking-wide text-white uppercase leading-none drop-shadow-lg whitespace-nowrap">
                {cat.name}
              </p>

              {/* Reveal block — fades in only when expanded */}
              <div
                style={{
                  maxHeight: expanded ? '120px' : '0',
                  opacity:   expanded ? 1 : 0,
                  marginTop: expanded ? '12px' : '0',
                  overflow:  'hidden',
                  transition: 'max-height 500ms ease, opacity 400ms ease, margin-top 400ms ease',
                }}
              >
                {cat.description && (
                  <p className="text-white/90 text-sm max-w-md mb-3">{cat.description}</p>
                )}
                <span className="inline-flex items-center gap-1.5 font-bold text-sm uppercase tracking-wider text-white">
                  Shop {cat.name}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Mobile tile ──────────────────────────────────────────────────────────────

function MobileTile({ category, palette }: { category: UiCategory; palette: { color: string; dark: string } }) {
  return (
    <Link
      to={`/shop?categoryId=${category.productCategoryId ?? category.id}`}
      className="relative block h-32 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
      style={{ boxShadow: `0 10px 30px -10px ${palette.color}60` }}
    >
      {category.image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${category.image})` }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg,
            ${palette.dark}f0 0%,
            ${palette.color}88 55%,
            ${palette.color}22 100%)`,
        }}
      />
      {/* Color glow at right edge */}
      <div
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl mix-blend-screen"
        style={{ backgroundColor: palette.color, opacity: 0.5 }}
      />
      <div className="relative h-full flex items-center px-5">
        <div>
          <p className="font-sport text-2xl tracking-wide text-white uppercase leading-tight drop-shadow-lg">
            {category.name}
          </p>
          <span className="text-[11px] font-bold uppercase tracking-widest mt-1 inline-flex items-center gap-1 text-white">
            Shop now
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
