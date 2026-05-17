import type { OfferStripItem } from '../../types';
import uiConfig from '../../data/ui-config.json';

const items = uiConfig.offersStrip as OfferStripItem[];

// Duplicate for seamless loop
const looped = [...items, ...items];

export function OffersStrip() {
  return (
    <div className="w-full bg-surface-raised overflow-hidden" style={{ height: '40px' }}>
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
  );
}
