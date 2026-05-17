import type { OfferStripItem } from '../../types';
import uiConfig from '../../data/ui-config.json';

const items = uiConfig.offersStrip as OfferStripItem[];
const looped = [...items, ...items];

export function OffersStrip() {
  return (
    <div className="w-full bg-surface-raised border-y border-stroke/60">
      <div className="overflow-hidden" style={{ height: '40px' }}>
        <div className="flex items-center h-full">
          <div
            className="marquee-track"
            style={{ animationDuration: '24s', animationPlayState: 'running' }}
          >
            {looped.map((item, idx) => (
              <span key={`${item.id}-${idx}`} className="flex items-center shrink-0">
                <span className="text-secondary text-[11px] md:text-xs font-medium whitespace-nowrap px-4 md:px-6">
                  {item.text}
                </span>
                <span className="text-muted text-[11px] md:text-xs select-none" aria-hidden="true">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
