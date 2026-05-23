import { useMemo } from 'react';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import type { OfferStripItem } from '../../types';
import uiConfig from '../../data/ui-config.json';

/**
 * Marquee strip of promo lines shown directly under the hero. Items are
 * sourced from the admin-managed `offer-strip` UI content slot; when the
 * backend slot is empty (or unreachable) we fall back to the static seed
 * list in `ui-config.json` so the UI never goes blank.
 */
export function OffersStrip() {
  const { items: remote } = useUiContentSlot<{ text: string }>('offer-strip', { activeOnly: true });

  const items = useMemo<OfferStripItem[]>(() => {
    if (remote.length > 0) {
      return remote.map((it) => ({ id: it.id, text: String(it.text ?? '').trim() }))
                   .filter((it) => it.text.length > 0);
    }
    return uiConfig.offersStrip as OfferStripItem[];
  }, [remote]);

  if (items.length === 0) return null;
  const looped = [...items, ...items];

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
