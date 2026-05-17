import type { OfferStripItem } from '../../types';
import uiConfig from '../../data/ui-config.json';

const items = uiConfig.offersStrip as OfferStripItem[];

// Duplicate for seamless desktop marquee loop
const looped = [...items, ...items];

export function OffersStrip() {
  return (
    <div className="w-full bg-surface-raised border-y border-stroke/60">
      {/* ── Desktop: infinite marquee ─────────────────────────────────────── */}
      <div className="hidden md:block overflow-hidden" style={{ height: '40px' }}>
        <div className="flex items-center h-full">
          <div className="marquee-track">
            {looped.map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="flex items-center shrink-0">
                <span className="text-secondary text-xs font-medium whitespace-nowrap px-6">
                  {item.text}
                </span>
                <span className="text-muted text-xs select-none" aria-hidden="true">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile: scrollable pill tags ──────────────────────────────────── */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-3">
          {items.map((item) => (
            <span
              key={item.id}
              className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-surface border border-accent/30 text-primary text-xs font-semibold whitespace-nowrap"
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
