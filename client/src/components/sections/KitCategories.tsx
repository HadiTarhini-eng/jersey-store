import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import type { Category } from '../../types';
import categoriesData from '../../data/categories.json';

const categories = categoriesData as Category[];

// Build rows of 2 for yin-yang mobile layout
const mobileRows: Category[][] = [];
for (let i = 0; i < categories.length; i += 2) {
  mobileRows.push(categories.slice(i, i + 2));
}

// Build rows of 3 for desktop parallelogram grid
const desktopRows: Category[][] = [];
for (let i = 0; i < categories.length; i += 3) {
  desktopRows.push(categories.slice(i, i + 3));
}

export function KitCategories() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  // Close popup on Escape
  React.useEffect(() => {
    if (!selectedId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedId]);

  // Lock scroll while popup is open
  React.useEffect(() => {
    if (selectedId) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedId]);

  return (
    <section className="py-12 md:py-16 w-full">
      {/* Section header */}
      <div className="mb-8">
        <h2 className={theme.sectionTitle}>Shop by Category</h2>
        <p className={theme.sectionSubtitle}>Every piece of kit you need, in one place</p>
      </div>

      {/* ── Mobile: yin-yang triangular rows ────────────────────────────────── */}
      <div className="flex flex-col gap-0 md:hidden">
        {mobileRows.map((row, rowIdx) => (
          <MobileRow
            key={rowIdx}
            left={row[0]}
            right={row[1]}
            onSelect={(cat) => setSelectedId(cat.id)}
          />
        ))}
      </div>

      {/* ── Desktop: staggered 3-column parallelogram grid ──────────────────── */}
      <div className="hidden md:flex flex-col gap-4">
        {desktopRows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-3 gap-4">
            {row.map((cat, colIdx) => (
              <DesktopCard key={cat.id} category={cat} tall={colIdx === 1} />
            ))}
          </div>
        ))}
      </div>

      {/* ── Mobile bottom-sheet popup ───────────────────────────────────────── */}
      {selectedId && selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden animate-fade-in"
          onClick={() => setSelectedId(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/85" />

          {/* Sheet */}
          <div
            className="relative w-full rounded-t-3xl overflow-hidden animate-slide-up shadow-2xl"
            style={{ minHeight: '55vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background image */}
            {selectedCategory.image && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${selectedCategory.image})` }}
              />
            )}

            {/* Colour gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top,
                  ${selectedCategory.colorDark ?? selectedCategory.color ?? '#000'}f5 0%,
                  ${selectedCategory.color ?? '#000'}99 55%,
                  transparent 100%)`,
              }}
            />

            {/* Drag handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/25" />

            {/* Close button */}
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end p-7 pt-16" style={{ minHeight: '55vh' }}>
              <span
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: selectedCategory.color ?? '#007aff' }}
              >
                Category
              </span>
              <h3 className="font-sport text-5xl tracking-wide text-white uppercase leading-none mb-2">
                {selectedCategory.name}
              </h3>
              {selectedCategory.description && (
                <p className="text-white/75 text-sm mb-6 max-w-xs">{selectedCategory.description}</p>
              )}
              <Link
                to={`/shop?category=${selectedCategory.slug}`}
                onClick={() => setSelectedId(null)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-200 active:scale-95"
                style={{ backgroundColor: selectedCategory.color ?? '#007aff' }}
              >
                Shop {selectedCategory.name}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Mobile yin-yang row ────────────────────────────────────────────────────────

interface MobileRowProps {
  left: Category;
  right?: Category;
  onSelect: (cat: Category) => void;
}

function MobileRow({ left, right, onSelect }: MobileRowProps) {
  const [hoveredSide, setHoveredSide] = React.useState<'left' | 'right' | null>(null);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '200px' }}>
      {/* Left triangular item */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(left)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(left)}
        className="absolute top-0 left-0 h-full flex items-center justify-center cursor-pointer"
        style={{
          width: '60%',
          backgroundImage: left.image ? `url(${left.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(0 0, 100% 0, 68% 100%, 0 100%)',
          transition: 'filter 300ms',
          filter: hoveredSide === 'right' ? 'brightness(0.45)' : 'brightness(1)',
        }}
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
      >
        {/* Colour overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundColor: left.color ?? '#007aff',
            opacity: hoveredSide === 'left' ? 0.25 : 0.55,
          }}
        />
        {/* Text */}
        <div className="relative z-10 text-center px-4 pr-12">
          <p className="font-sport text-2xl tracking-wide text-white uppercase drop-shadow-lg leading-tight">
            {left.name}
          </p>
          {left.description && (
            <p
              className="text-white/70 text-xs mt-0.5 transition-opacity duration-300"
              style={{ opacity: hoveredSide === 'left' ? 1 : 0.7 }}
            >
              {left.description}
            </p>
          )}
        </div>
      </div>

      {/* Right triangular item */}
      {right && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(right)}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(right)}
          className="absolute top-0 right-0 h-full flex items-center justify-center cursor-pointer"
          style={{
            width: '60%',
            backgroundImage: right.image ? `url(${right.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            clipPath: 'polygon(32% 0, 100% 0, 100% 100%, 0 100%)',
            transition: 'filter 300ms',
            filter: hoveredSide === 'left' ? 'brightness(0.45)' : 'brightness(1)',
          }}
          onMouseEnter={() => setHoveredSide('right')}
          onMouseLeave={() => setHoveredSide(null)}
        >
          {/* Colour overlay */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundColor: right.color ?? '#ff4d00',
              opacity: hoveredSide === 'right' ? 0.25 : 0.55,
            }}
          />
          {/* Text */}
          <div className="relative z-10 text-center px-4 pl-12">
            <p className="font-sport text-2xl tracking-wide text-white uppercase drop-shadow-lg leading-tight">
              {right.name}
            </p>
            {right.description && (
              <p
                className="text-white/70 text-xs mt-0.5 transition-opacity duration-300"
                style={{ opacity: hoveredSide === 'right' ? 1 : 0.7 }}
              >
                {right.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Desktop parallelogram card ─────────────────────────────────────────────────

interface DesktopCardProps {
  category: Category;
  tall?: boolean;
}

function DesktopCard({ category, tall }: DesktopCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const height = tall ? '380px' : '320px';

  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="relative rounded-2xl overflow-hidden block focus:outline-none"
      style={{
        height,
        transform: hovered ? 'scale(1.03) translateY(-6px)' : 'scale(1) translateY(0)',
        transition: 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease',
        boxShadow: hovered
          ? `0 24px 60px ${category.color ?? '#007aff'}33, 0 8px 30px rgba(0,0,0,0.5)`
          : '0 4px 20px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image with parallelogram clip */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: category.image ? `url(${category.image})` : undefined,
          clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 600ms ease',
        }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${category.colorDark ?? category.color ?? '#000'}ee 0%, ${category.color ?? '#000'}44 55%, transparent 100%)`,
          opacity: hovered ? 1 : 0.8,
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Coloured bottom border — slides in on hover */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-2xl"
        style={{
          backgroundColor: category.color ?? '#007aff',
          transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 350ms ease',
        }}
      />

      {/* Name tag — fades out on hover */}
      <div
        className="absolute top-4 left-5 px-3 py-1 rounded-full text-xs font-semibold text-white"
        style={{
          backgroundColor: `${category.color ?? '#007aff'}bb`,
          opacity: hovered ? 0 : 1,
          transition: 'opacity 250ms ease',
        }}
      >
        {category.name}
      </div>

      {/* Info panel — slides up on hover */}
      <div
        className="absolute inset-x-0 bottom-0 px-6 pb-7"
        style={{
          transform: hovered ? 'translateY(0)' : 'translateY(12px)',
          transition: 'transform 350ms ease',
        }}
      >
        <p className="font-sport text-2xl md:text-3xl tracking-wide text-white uppercase leading-tight drop-shadow-lg">
          {category.name}
        </p>
        <div
          style={{
            maxHeight: hovered ? '80px' : '0',
            opacity: hovered ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 350ms ease, opacity 300ms ease',
          }}
        >
          {category.description && (
            <p className="text-white/80 text-sm mt-2">{category.description}</p>
          )}
          <span
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold"
            style={{ color: category.color ?? '#007aff' }}
          >
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}
