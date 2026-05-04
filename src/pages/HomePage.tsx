import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../features/products/components/ProductCard';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { productService } from '../services/productService';
import { formatPrice } from '../utils/formatters';
import uiConfig   from '../data/ui-config.json';
import siteConfig from '../data/site-config.json';
import type { HeroSlide, FeaturedSection, Product, SiteConfig } from '../types';

const { slides }           = uiConfig.hero;
const { featuredSections } = uiConfig;
const { freeShippingThreshold, currency } = siteConfig as SiteConfig;

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredMap, setFeaturedMap]   = useState<Record<string, Product[]>>({});
  const [loading, setLoading]           = useState(true);

  // Auto-advance hero slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all featured sections in parallel
  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        (featuredSections as FeaturedSection[]).map(async (section) => {
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

  const slide = slides[currentSlide] as HeroSlide;

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden bg-surface">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 gradient-to-bg" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl animate-slide-up">
            {slide.badge && (
              <Badge variant="accent" className="mb-4">{slide.badge}</Badge>
            )}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-primary">
              {slide.headline}
            </h1>
            <p className="mt-4 text-lg text-secondary leading-relaxed max-w-md">
              {slide.subheadline}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link to={slide.ctaHref}>
                <Button variant="primary" size="lg">{slide.ctaLabel}</Button>
              </Link>
              <Link to="/shop">
                <Button variant="ghost" size="lg">Browse All</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={[
                  'rounded-full transition-all duration-300',
                  i === currentSlide ? 'w-6 h-2 bg-accent' : 'w-2 h-2 bg-stroke hover:bg-muted',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Free shipping banner ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-wrap items-center justify-center gap-8 py-4 border-y border-stroke text-sm text-secondary">
          <span className="flex items-center gap-2">
            <span className="text-accent">✦</span>
            Free shipping on orders over {formatPrice(freeShippingThreshold, currency)}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-accent">✦</span>
            Authentic, officially licensed jerseys
          </span>
          <span className="flex items-center gap-2">
            <span className="text-accent">✦</span>
            30-day hassle-free returns
          </span>
        </div>
      </div>

      {/* ── Featured sections ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        (featuredSections as FeaturedSection[]).map((section) => {
          const products = featuredMap[section.id] ?? [];
          if (!products.length) return null;

          return (
            <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                    {section.title}
                  </h2>
                  <p className="text-secondary text-sm mt-1">{section.subtitle}</p>
                </div>
                <Link
                  to={`/shop${section.sportFilter ? `?sport=${section.sportFilter}` : ''}`}
                  className="text-sm text-accent hover:text-accent-light font-medium transition-colors shrink-0 ml-4"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* ── Sports category grid ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary mb-8">
          Shop by Sport
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {uiConfig.nav.links[0].children?.slice(1).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-surface border border-stroke hover:border-accent/30 hover:bg-surface-raised transition-all duration-200 text-center"
            >
              <span className="text-2xl">{getSportEmoji(item.label)}</span>
              <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getSportEmoji(label: string): string {
  const map: Record<string, string> = {
    Football: '⚽', Basketball: '🏀', 'Formula 1': '🏎', 'American Football': '🏈', Baseball: '⚾',
  };
  return map[label] ?? '🏆';
}
