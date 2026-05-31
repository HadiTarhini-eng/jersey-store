import React from 'react';
import { Link } from 'react-router-dom';
import { ProductSlider } from '../features/products/components/ProductSlider';
import { theme } from '../config/theme';
import { productService } from '../services/productService';
import { OffersStrip } from '../components/sections/OffersStrip';
import { OffersBanner } from '../components/sections/OffersBanner';
import { SportsCarousel } from '../components/sections/SportsCarousel';
import { TeamsSlider } from '../components/sections/TeamsSlider';
import { KitCategories } from '../components/sections/KitCategories';
import { useUiContentSlot } from '../hooks/useUiContentSlot';
import { useFeaturedSections } from '../hooks/useFeaturedSections';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import type { HeroSlide, Product } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// HeroSection — drives per-slide art direction: accent color, content
// alignment, and gradient overlay anchor are all read from each slide so
// every slogan gets its own visual personality.
// ─────────────────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  slide:         HeroSlide;
  slides:        HeroSlide[];
  currentSlide:  number;
  onSelectSlide: (i: number) => void;
  designYourOwn: { label: string; href: string };
}

// Gradient anchors keyed by per-slide `overlay`. Lifted out of the component
// so we don't rebuild this lookup on every render.
const OVERLAY_GRADIENT: Record<NonNullable<HeroSlide['overlay']>, string> = {
  left:   'bg-gradient-to-r from-background via-background/80 to-transparent',
  right:  'bg-gradient-to-l from-background via-background/80 to-transparent',
  center: 'bg-gradient-to-t from-background via-background/70 to-background/40',
  bottom: 'bg-gradient-to-t from-background via-background/85 to-transparent',
};

function HeroSection({ slide, slides, currentSlide, onSelectSlide, designYourOwn }: HeroSectionProps) {
  const accent  = slide.accent  ?? 'rgb(var(--accent))';
  const align   = slide.align   ?? 'left';

  // Where the legible-content block sits horizontally
  const blockAlign = {
    left:   'mr-auto text-left items-start',
    center: 'mx-auto text-center items-center',
    right:  'ml-auto text-right items-end',
  }[align];

  return (
    <section className="relative min-h-[55vh] sm:min-h-[65vh] md:min-h-screen flex items-center overflow-hidden">
      {/* Layered slide backgrounds — each slide's image + gradient is mounted
          exactly once and we crossfade by toggling opacity. Avoids the
          `key={slide.id}` remount-and-refetch on every auto-advance. */}
      {slides.map((s, i) => {
        const active = i === currentSlide;
        return (
          <div
            key={s.id}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${s.image})` }}
            />
            <div className={`absolute inset-0 ${OVERLAY_GRADIENT[s.overlay ?? 'left']}`} />
          </div>
        );
      })}

      {/* Bottom fade into the page background */}
      <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 gradient-to-bg" />

      {/* Content */}
      <div className={`relative ${theme.pageContainer} w-full py-14 md:py-20`}>
        <div className={`flex flex-col max-w-xl animate-slide-up ${blockAlign}`}>
          {slide.badge && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase border mb-4 md:mb-5"
              style={{
                color: accent,
                backgroundColor: `${accent}26`, // ~15% tint
                borderColor: `${accent}55`,
              }}
            >
              {slide.badge}
            </span>
          )}

          <h1
            className="font-sport text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide uppercase leading-[0.9] mb-3 md:mb-4"
            style={{
              whiteSpace: 'pre-line',
              color: '#000000',
              WebkitTextStroke: '2px #ffffff',
              paintOrder: 'stroke fill',
            }}
          >
            {slide.headline}
          </h1>

          {/* Accent underline — adds the slide's color signature without coloring the headline itself */}
          <div
            className="h-[3px] w-16 mb-4 md:mb-6"
            style={{ backgroundColor: accent }}
          />

          <p
            className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-wider leading-relaxed max-w-sm mb-6 md:mb-8"
            style={{
              color: '#000000',
              WebkitTextStroke: '1px #ffffff',
              paintOrder: 'stroke fill',
            }}
          >
            {slide.subheadline}
          </p>

          <div className={`flex flex-wrap items-center gap-3 md:gap-4 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
            {/* Primary CTA — switches between <a target="_blank"> and <Link>
                based on whether the admin chose an external URL or an
                in-app filter. The mutually-exclusive distinction is set in
                AdminOffers via ShopFilterPicker. */}
            {/^https?:\/\//i.test(slide.ctaHref) ? (
              <a
                href={slide.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase border-2 border-white bg-white text-black hover:bg-black hover:text-white active:scale-95 transition-colors duration-200 focus-accent"
              >
                {slide.ctaLabel}
              </a>
            ) : (
              <Link to={slide.ctaHref}>
                <button
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase border-2 border-white bg-white text-black hover:bg-black hover:text-white active:scale-95 transition-colors duration-200 focus-accent"
                >
                  {slide.ctaLabel}
                </button>
              </Link>
            )}
            {/*
              "Design Your Own" CTA — hidden for now (feature pending). Keep
              the markup so we can flip the gate later without rebuilding.
              When ready, replace the surrounding `false &&` with a real
              feature flag (e.g. `siteConfig.homepageSectionsVisible?.['hero-design-your-own']`).
            */}
            {false && (
              <Link to={designYourOwn.href}>
                <button
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase border-2 text-white hover:scale-105 active:scale-95 transition-all duration-200 focus-accent"
                  style={{ borderColor: accent, color: accent, backgroundColor: `${accent}14` }}
                >
                  {designYourOwn.label}
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Slide dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSelectSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === currentSlide ? '2rem' : '0.5rem',
                height: '0.5rem',
                backgroundColor: i === currentSlide ? accent : 'rgb(var(--stroke))',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const { items: slides }      = useUiContentSlot<Omit<HeroSlide, 'id'>>('hero-slide', { activeOnly: true });
  const { sections: featuredSections } = useFeaturedSections();
  const siteConfig             = useSiteConfig();

  const designYourOwn = {
    label: siteConfig.heroDesignYourOwnLabel ?? 'Design Your Own',
    href:  siteConfig.heroDesignYourOwnHref  ?? '/custom',
  };

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [featuredMap, setFeaturedMap]   = React.useState<Record<string, Product[]>>({});
  const [loading, setLoading]           = React.useState(true);

  // Keep currentSlide within bounds if the admin removes a slide.
  const safeIndex = slides.length === 0 ? 0 : currentSlide % slides.length;

  // Auto-advance hero slides every 8s — re-arm when the slide count changes.
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(
      () => setCurrentSlide((i) => (i + 1) % slides.length),
      8000,
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  React.useEffect(() => {
    if (featuredSections.length === 0) return;
    (async () => {
      const results = await Promise.all(
        featuredSections.map(async (section) => {
          const products = await productService.getFeatured(
            { sport: section.sportFilter, team: section.teamFilter },
            section.limit,
          );
          return [section.id, products] as const;
        }),
      );
      setFeaturedMap(Object.fromEntries(results));
      setLoading(false);
    })();
  }, [featuredSections]);

  const slide = slides[safeIndex];

  return (
    <div className="flex flex-col bg-background">

      {/* ── 1. Hero — only renders when there's at least one slide ───────────── */}
      {slide && (
        <HeroSection
          slide={slide}
          slides={slides}
          currentSlide={safeIndex}
          onSelectSlide={setCurrentSlide}
          designYourOwn={designYourOwn}
        />
      )}


      {/* ── 2. Offers Strip ──────────────────────────────────────────────────── */}
      <OffersStrip />

      {/* ── 3. Offers Banner ─────────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full py-6 md:py-8`}>
        <OffersBanner />
      </div>

      {/* ── 4. New Arrivals ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className={`${theme.pageContainer} w-full py-6 md:py-8`}>
          <div className="flex gap-4 overflow-hidden pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[calc(50%_-_8px)] md:w-[calc(33.33%_-_11px)] lg:w-[calc(25%_-_12px)] shimmer rounded-2xl"
                style={{ height: '340px' }}
              />
            ))}
          </div>
        </div>
      ) : (
        featuredSections.map((section) => {
          const products = featuredMap[section.id] ?? [];
          if (!products.length) return null;

          return (
            <section
              key={section.id}
              className={`${theme.pageContainer} w-full py-6 md:py-8`}
            >
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className={theme.sectionTitle}>{section.title}</h2>
                  <p className={theme.sectionSubtitle}>{section.subtitle}</p>
                </div>
                <Link
                  to={`/shop${section.sportFilter ? `?sport=${section.sportFilter}` : ''}`}
                  className="group flex items-center gap-1.5 text-sm text-accent hover:text-accent-light font-medium transition-colors shrink-0 ml-4"
                >
                  View all
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
              <ProductSlider products={products} />
            </section>
          );
        })
      )}

      {/* ── 5. Sports Carousel ───────────────────────────────────────────────── */}
      {/* Hidden when the admin has explicitly toggled off the `shop-by-sport`
          section under Settings → Homepage sections. Missing key = visible. */}
      {(siteConfig.homepageSectionsVisible?.['shop-by-sport'] !== false) && (
        <div className={`${theme.pageContainer} w-full py-6 md:py-8`}>
          <div className="mb-6">
            <h2 className={theme.sectionTitle}>Shop by Sport</h2>
            <p className={theme.sectionSubtitle}>Pick your sport and find the perfect kit</p>
          </div>
          <SportsCarousel />
        </div>
      )}

      {/* ── 6. Teams Slider ──────────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full py-2 md:py-3`}>
        <TeamsSlider />
      </div>

      {/* ── 7. Kit Categories ────────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full py-2 md:py-3`}>
        <KitCategories />
      </div>

      <div className="pb-10" />
    </div>
  );
}
