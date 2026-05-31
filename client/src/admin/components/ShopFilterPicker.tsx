import { useEffect, useState } from 'react';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import { categoryApi } from '../../services/api';
import type { Category, Sport, Team } from '../../types';

/**
 * The kinds of destinations an admin can target from a banner/hero CTA.
 * `none` points to the bare /shop page. `external` is a fully-qualified URL
 * (http/https) — useful for campaign landing pages outside the storefront.
 * Per item the admin chooses **either** an in-app filter **or** an external
 * URL — they're mutually exclusive on the wire (`ctaHref` holds whichever).
 */
export type ShopFilterType = 'none' | 'sport' | 'team' | 'category' | 'badge' | 'query' | 'external';

export interface ShopFilterValue {
  type:   ShopFilterType;
  /** Slug / id / free-text value, depending on `type`. */
  value:  string;
}

/** True when `value` looks like a full external URL (http or https). */
export function isExternalUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Turn a `(type, value)` pair into the final destination string.
 *
 * - Internal filters → `/shop?...` URL the storefront knows how to parse
 *   via `useFilters` and ShopPage's slug→id resolver.
 * - `external` → the URL as-is (http/https), so it can be rendered with
 *   `<a href target="_blank">` by the consumer.
 */
export function buildShopUrl(filter: ShopFilterValue | string | undefined | null): string {
  // Free-text legacy string (back-compat with existing `ctaHref` values).
  if (typeof filter === 'string') {
    const trimmed = filter.trim();
    return trimmed || '/shop';
  }
  if (!filter || filter.type === 'none' || !filter.value.trim()) return '/shop';
  const raw = filter.value.trim();
  const v = encodeURIComponent(raw);
  switch (filter.type) {
    case 'sport':    return `/shop?sport=${v}`;
    case 'team':     return `/shop?team=${v}`;
    case 'category': return `/shop?categoryId=${v}`;
    case 'badge':    return `/shop?badge=${v}`;
    case 'query':    return `/shop?q=${v}`;
    case 'external': return raw; // Preserve as-is — consumer renders as <a href>.
    default:         return '/shop';
  }
}

/**
 * Reverse: try to parse an existing URL string back into a `ShopFilterValue`
 * so the picker shows the right state when editing an existing record.
 */
export function parseShopUrl(href: string | undefined | null): ShopFilterValue {
  if (!href) return { type: 'none', value: '' };
  const trimmed = href.trim();
  if (!trimmed) return { type: 'none', value: '' };
  // External URL — anything starting with http:// or https://.
  if (isExternalUrl(trimmed)) return { type: 'external', value: trimmed };
  // Match /shop?<key>=<value>
  const match = /^\/shop\?(sport|team|categoryId|badge|q)=(.+)$/.exec(trimmed);
  if (match) {
    const key = match[1];
    const value = decodeURIComponent(match[2]);
    if (key === 'categoryId') return { type: 'category', value };
    if (key === 'q')          return { type: 'query',    value };
    return { type: key as ShopFilterType, value };
  }
  if (trimmed === '/shop')   return { type: 'none', value: '' };
  // Any other internal path falls through to none — the legacy `custom` option
  // was removed because every legitimate case is either a /shop filter or an
  // external URL now.
  return { type: 'none', value: '' };
}

interface PickerProps {
  value:    ShopFilterValue;
  onChange: (next: ShopFilterValue) => void;
  /** Tailwind class for the inputs — passed in so this component can live
   *  inside both light-and-dark editor modals without restyling itself. */
  inputClass: string;
}

/**
 * Admin-side filter picker. Two-step: pick the filter TYPE, then pick the
 * VALUE — the value field changes shape (dropdown of sports, dropdown of
 * teams, etc.) based on the type so the admin can never type a bad slug.
 */
export function ShopFilterPicker({ value, onChange, inputClass }: PickerProps) {
  const sports     = useUiContentSlot<Omit<Sport, 'id'>>('sport',        { activeOnly: false });
  const teams      = useUiContentSlot<Omit<Team,  'id'>>('team',         { activeOnly: false });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    categoryApi.list({ isActive: true })
      .then((cats) => { if (!cancelled) setCategories(cats); })
      .catch(() => { /* leave empty */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
      <select
        value={value.type}
        onChange={(e) => onChange({ type: e.target.value as ShopFilterType, value: '' })}
        className={inputClass}
        aria-label="Filter type"
      >
        <option value="none">No filter (just /shop)</option>
        <option value="sport">By sport</option>
        <option value="team">By team</option>
        <option value="category">By category</option>
        <option value="badge">By badge (New / Sale …)</option>
        <option value="query">By search query</option>
        <option value="external">External URL</option>
      </select>

      {value.type === 'none' ? (
        <p className="text-xs text-muted self-center">Tile links to /shop with no filter applied.</p>
      ) : value.type === 'sport' ? (
        <select
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className={inputClass}
        >
          <option value="">Choose a sport…</option>
          {sports.items.map((s) => (
            <option key={s.id} value={s.slug ?? s.id}>{s.name}</option>
          ))}
        </select>
      ) : value.type === 'team' ? (
        <select
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className={inputClass}
        >
          <option value="">Choose a team…</option>
          {teams.items.map((t) => (
            <option key={t.id} value={t.slug ?? t.id}>{t.name}</option>
          ))}
        </select>
      ) : value.type === 'category' ? (
        <select
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className={inputClass}
        >
          <option value="">Choose a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      ) : value.type === 'badge' ? (
        <select
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className={inputClass}
        >
          <option value="">Choose a badge…</option>
          <option value="New">New</option>
          <option value="Sale">Sale</option>
          <option value="Limited">Limited</option>
        </select>
      ) : value.type === 'query' ? (
        <input
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          placeholder="Search term — e.g. world cup"
          className={inputClass}
        />
      ) : (
        // External URL — opens in a new tab when clicked. Mutually exclusive
        // with any /shop filter; pick one per item, not both.
        <input
          type="url"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          placeholder="https://example.com/landing"
          className={inputClass}
        />
      )}
    </div>
  );
}
