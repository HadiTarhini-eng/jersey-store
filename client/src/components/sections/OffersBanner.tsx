import React from 'react';
import { Link } from 'react-router-dom';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import { useSwipe } from '../../hooks/useSwipe';
import type { OfferBanner } from '../../types';

export function OffersBanner() {
  const { items: banners } = useUiContentSlot<Omit<OfferBanner, 'id'>>('offer-banner', { activeOnly: true });
  const [current, setCurrent] = React.useState(0);

  // Clamp index so admin-side deletes don't blow up the carousel.
  const safeIndex = banners.length === 0 ? 0 : current % banners.length;

  // Manual swipe — runs alongside the 4s auto-advance, which keeps cycling.
  const swipe = useSwipe({
    onSwipeLeft:  () => banners.length > 1 && setCurrent((i) => (i + 1) % banners.length),
    onSwipeRight: () => banners.length > 1 && setCurrent((i) => (i - 1 + banners.length) % banners.length),
  });

  // Auto-advance every 4s — re-arm when banner count changes. The crossfade
  // is a pure CSS opacity transition on the layered banners below, so no
  // intermediate `animating` state is needed.
  React.useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden touch-pan-y select-none"
      style={{ height: 'clamp(180px, 25vw, 220px)' }}
      {...(banners.length > 1 ? swipe : {})}
    >
      {/* Each banner is mounted once and crossfaded by opacity — image
          requests fire on first mount only, never on cycle. */}
      {banners.map((banner, i) => {
        const active = i === safeIndex;
        const linkHref = banner.ctaHref?.trim() || '/shop';
        const external = /^https?:\/\//i.test(linkHref);

        return (
          <div
            key={banner.id}
            aria-hidden={!active}
            className={[
              'absolute inset-0 transition-opacity duration-300',
              active ? 'opacity-100' : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            {/* Whole-banner click target. `ctaHref` is still the persisted
                destination string — the admin form just builds it from a
                filter picker now. When the value is an external http(s) URL
                we render an `<a>` (new tab); otherwise it's an internal
                route via `<Link>`. */}
            {external ? (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={banner.headline}
                className="absolute inset-0 z-10 focus-accent rounded-2xl"
              />
            ) : (
              <Link
                to={linkHref}
                aria-label={banner.headline}
                className="absolute inset-0 z-10 focus-accent rounded-2xl"
              />
            )}

            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.image})` }}
            />

            {/* Color tint overlay */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `${banner.color}99` }}
            />

            {/* Dark gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center px-6 md:px-10 pointer-events-none">
              <span
                className="inline-block self-start mb-2 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: banner.color }}
              >
                {banner.label}
              </span>

              <h3 className="font-sport text-3xl md:text-5xl tracking-wide text-primary uppercase leading-none mb-1">
                {banner.headline}
              </h3>

              <p className="text-secondary text-sm md:text-base max-w-xs">
                {banner.subheadline}
              </p>
            </div>
          </div>
        );
      })}

      {/* Dot navigation — sits above the link layers (z-20) so taps on dots
          navigate the carousel instead of following the active banner. */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
              aria-label={`Go to banner ${i + 1}`}
              className={[
                'rounded-full transition-all duration-300',
                i === safeIndex ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
