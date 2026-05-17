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
import uiConfig from '../data/ui-config.json';
import type { HeroSlide, FeaturedSection, Product } from '../types';

const slides = uiConfig.hero.slides as HeroSlide[];
const featuredSections = uiConfig.featuredSections as FeaturedSection[];
const designYourOwn = uiConfig.hero.designYourOwn;

export function HomePage() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [featuredMap, setFeaturedMap]   = React.useState<Record<string, Product[]>>({});
  const [loading, setLoading]           = React.useState(true);

  // Auto-advance hero slides every 5s
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(
      () => setCurrentSlide((i) => (i + 1) % slides.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  // Fetch all featured sections in parallel
  React.useEffect(() => {
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
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col">

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          {/* Left-to-right dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 gradient-to-bg" />
        </div>

        {/* Content */}
        <div className={`relative ${theme.pageContainer} w-full py-20`}>
          <div className="max-w-xl animate-slide-up">
            {/* Badge */}
            {slide.badge && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-accent/20 text-accent border border-accent/30 mb-5">
                {slide.badge}
              </span>
            )}

            {/* Headline — supports \n line breaks */}
            <h1
              className="font-sport text-6xl sm:text-7xl lg:text-8xl tracking-wide text-primary uppercase leading-none mb-4"
              style={{ whiteSpace: 'pre-line' }}
            >
              {slide.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-secondary text-lg leading-relaxed max-w-sm mb-8">
              {slide.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link to={slide.ctaHref}>
                <button className={theme.btnPrimary}>{slide.ctaLabel}</button>
              </Link>
              <Link to={designYourOwn.href}>
                <button className={`${theme.btnPower} animate-pulse-glow`}>
                  {designYourOwn.label}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={[
                  'rounded-full transition-all duration-300',
                  i === currentSlide
                    ? 'w-8 h-2 bg-accent'
                    : 'w-2 h-2 bg-stroke hover:bg-muted',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Offers Strip ──────────────────────────────────────────────────── */}
      <OffersStrip />

      {/* ── 3. Offers Banner ─────────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full py-8 md:py-10`}>
        <OffersBanner />
      </div>

      {/* ── 4. New Arrivals Slider ───────────────────────────────────────────── */}
      {loading ? (
        <div className={`${theme.pageContainer} w-full py-12 md:py-16`}>
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
              className={`${theme.pageContainer} w-full py-12 md:py-16`}
            >
              {/* Section header */}
              <div className="flex items-end justify-between mb-8">
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

              {/* Product slider */}
              <ProductSlider products={products} />
            </section>
          );
        })
      )}

      {/* ── 5. Sports Carousel ───────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full py-12 md:py-16`}>
        <div className="mb-8">
          <h2 className={theme.sectionTitle}>Shop by Sport</h2>
          <p className={theme.sectionSubtitle}>Pick your sport and find the perfect kit</p>
        </div>
        <SportsCarousel />
      </div>

      {/* ── 6. Teams Slider ──────────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full`}>
        <TeamsSlider />
      </div>

      {/* ── 7. Kit Categories ────────────────────────────────────────────────── */}
      <div className={`${theme.pageContainer} w-full`}>
        <KitCategories />
      </div>

      {/* Bottom spacer */}
      <div className="pb-10" />
    </div>
  );
}
