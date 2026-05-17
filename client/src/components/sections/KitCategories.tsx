import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import { useAdminCollection } from '../../admin/hooks/useAdminCollection';
import type { UiCategory } from '../../types';
import categoriesData from '../../data/categories.json';

const categoriesSeed = categoriesData as UiCategory[];

export function KitCategories() {
  const { items: categories } = useAdminCollection<UiCategory>('kit-categories', categoriesSeed);

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
        {categories.map((cat) => (
          <MobileTile key={cat.id} category={cat} />
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
      {categories.map((cat) => {
        const expanded = hoveredId === cat.id;
        const shrunk   = hoveredId !== null && !expanded;

        return (
          <Link
            key={cat.id}
            to={`/shop?categoryId=${cat.slug}`}
            onMouseEnter={() => setHoveredId(cat.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative overflow-hidden rounded-2xl group cursor-pointer"
            style={{
              flex: expanded ? '3.2 1 0%' : shrunk ? '0.7 1 0%' : '1 1 0%',
              transition: 'flex 700ms cubic-bezier(0.22, 1, 0.36, 1)',
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

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top,
                  ${cat.colorDark ?? cat.color ?? '#000'}f2 0%,
                  ${cat.color ?? '#000'}55 50%,
                  transparent 100%)`,
                opacity: expanded ? 1 : 0.7,
                transition: 'opacity 500ms ease',
              }}
            />

            {/* Color accent bar — slides up on hover */}
            <div
              className="absolute inset-x-0 bottom-0 h-1"
              style={{
                backgroundColor: cat.color ?? 'rgb(var(--accent))',
                transform: expanded ? 'scaleX(1)' : 'scaleX(0.2)',
                transformOrigin: 'left',
                transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              <p
                className="font-sport text-3xl lg:text-4xl tracking-wide text-white uppercase leading-none drop-shadow-lg whitespace-nowrap"
                style={{
                  writingMode: expanded ? 'horizontal-tb' : 'horizontal-tb',
                  transition: 'transform 500ms ease, opacity 500ms ease',
                }}
              >
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
                  <p className="text-white/85 text-sm max-w-md mb-3">{cat.description}</p>
                )}
                <span
                  className="inline-flex items-center gap-1.5 font-semibold text-sm uppercase tracking-wider"
                  style={{ color: '#fff' }}
                >
                  Shop {cat.name} →
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

function MobileTile({ category }: { category: UiCategory }) {
  return (
    <Link
      to={`/shop?categoryId=${category.slug}`}
      className="relative block h-32 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
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
            ${category.colorDark ?? category.color ?? '#000'}ee 0%,
            ${category.color ?? '#000'}55 70%,
            transparent 100%)`,
        }}
      />
      <div className="relative h-full flex items-center px-5">
        <div>
          <p className="font-sport text-2xl tracking-wide text-white uppercase leading-tight drop-shadow-lg">
            {category.name}
          </p>
          <span
            className="text-xs font-semibold uppercase tracking-widest mt-1 inline-block"
            style={{ color: category.color ?? '#fff' }}
          >
            Shop now →
          </span>
        </div>
      </div>
    </Link>
  );
}
