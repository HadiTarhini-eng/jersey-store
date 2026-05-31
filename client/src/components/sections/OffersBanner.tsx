import React from 'react';
import { Link } from 'react-router-dom';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import type { OfferBanner } from '../../types';

export function OffersBanner() {
  const { items: banners } = useUiContentSlot<Omit<OfferBanner, 'id'>>('offer-banner', { activeOnly: true });
  const [current, setCurrent] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);

  // Clamp index so admin-side deletes don't blow up the carousel.
  const safeIndex = banners.length === 0 ? 0 : current % banners.length;

  // Auto-advance every 4s — re-arm when banner count changes.
  React.useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((i) => (i + 1) % banners.length);
        setAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = (idx: number) => {
    if (idx === safeIndex) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 300);
  };

  const banner = banners[safeIndex];
  if (!banner) return null;

  // Whole-banner click target. `ctaHref` is still the persisted destination
  // string — the admin form just builds it from a filter picker now. When
  // the value is an external http(s) URL we render an `<a>` (new tab);
  // otherwise it's an internal route via `<Link>`.
  const linkHref = banner.ctaHref?.trim() || '/shop';
  const external = /^https?:\/\//i.test(linkHref);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 'clamp(180px, 25vw, 220px)' }}>
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
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{
          backgroundImage: `url(${banner.image})`,
          opacity: animating ? 0 : 1,
        }}
      />

      {/* Color tint overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: `${banner.color}99`,
          opacity: animating ? 0 : 1,
        }}
      />

      {/* Dark gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />

      {/* Content */}
      <div
        className="relative h-full flex flex-col justify-center px-6 md:px-10 transition-all duration-300 pointer-events-none"
        style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateX(-8px)' : 'translateX(0)' }}
      >
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

      {/* Dot navigation — sits above the link layer (z-20) so taps on dots
          navigate the carousel instead of following the banner link. */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
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
