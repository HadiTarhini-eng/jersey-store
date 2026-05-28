/**
 * UI-only product fields (sport, team, badge, currency, features, display-category)
 * don't live in the backend Product entity. Instead they piggy-back on
 * `Product.tags[]` as `key:value` strings — reversible without schema changes.
 * This module owns that encoding so both the admin form and the storefront
 * detail page agree on the wire format.
 *
 * **Legacy keys**: `originalPrice:` and `printable:` were once encoded here too.
 * The backend now exposes them as first-class columns (`compareAtPrice` and
 * `printable`). Decode keeps reading the legacy tags as a fallback for rows
 * that haven't been re-saved yet; encode no longer emits them.
 */

const META_KEYS = ['sport', 'team', 'category', 'badge', 'currency', 'originalPrice', 'feature', 'printable'] as const;
export type ProductMetaKey = (typeof META_KEYS)[number];

const META_PREFIX_PATTERN = new RegExp(`^(${META_KEYS.join('|')}):`, 'i');

export function isMetaTag(tag: string): boolean {
  return META_PREFIX_PATTERN.test(tag);
}

export interface ProductMeta {
  sport:         string;
  team:          string;
  /** Display-only category label (decoupled from backend categoryId). */
  category:      string;
  badge:         string | undefined;
  currency:      string;
  originalPrice: number | undefined;
  features:      string[];
  /** Allows customer to enter a custom name + number on the detail page. */
  printable:     boolean;
  /** User-facing tags only — encoded meta entries are stripped. */
  tags:          string[];
}

export function decodeProductTags(tags: readonly string[] | null | undefined): ProductMeta {
  const out: ProductMeta = {
    sport:    '',
    team:     '',
    category: '',
    badge:    undefined,
    currency: 'USD',
    originalPrice: undefined,
    features:  [],
    printable: false,
    tags:      [],
  };
  if (!tags) return out;

  for (const raw of tags) {
    const match = /^([^:]+):(.+)$/.exec(raw);
    if (!match || !isMetaTag(raw)) {
      out.tags.push(raw);
      continue;
    }
    const [, k, v] = match;
    switch (k.toLowerCase() as ProductMetaKey) {
      case 'sport':         out.sport = v; break;
      case 'team':          out.team = v; break;
      case 'category':      out.category = v; break;
      case 'badge':         out.badge = v; break;
      case 'currency':      out.currency = v; break;
      case 'originalPrice': {
        const n = Number(v);
        out.originalPrice = Number.isFinite(n) ? n : undefined;
        break;
      }
      case 'feature':       out.features.push(v); break;
      case 'printable':     out.printable = v === 'true' || v === '1'; break;
    }
  }
  return out;
}

interface EncodableMeta {
  sport?:         string;
  team?:          string;
  category?:      string;
  badge?:         string | null;
  currency?:      string;
  originalPrice?: number | null;
  features?:      readonly string[];
  printable?:     boolean;
  tags?:          readonly string[];
}

export function encodeProductTags(p: EncodableMeta): string[] {
  const next: string[] = [];
  if (p.sport)    next.push(`sport:${p.sport}`);
  if (p.team)     next.push(`team:${p.team}`);
  if (p.category) next.push(`category:${p.category}`);
  if (p.badge)    next.push(`badge:${p.badge}`);
  if (p.currency) next.push(`currency:${p.currency}`);
  // originalPrice and printable now live as real columns on `products` and are
  // no longer emitted here — keeping them would shadow the canonical values.
  for (const f of p.features ?? []) next.push(`feature:${f}`);
  for (const t of p.tags ?? [])     next.push(t);
  return next;
}
