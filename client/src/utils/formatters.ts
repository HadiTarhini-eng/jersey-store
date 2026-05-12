/** Pure formatting utilities — no side effects, no imports. */

/** Format a price with currency symbol. */
export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

/** Format a discount percentage. */
export function discountPercent(original: number, sale: number): string {
  const pct = Math.round(((original - sale) / original) * 100);
  return `-${pct}%`;
}

/** Truncate text to a maximum length with ellipsis. */
export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + '…';
}

/** Render star rating as "4.8 / 5" */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} / 5`;
}

/** Format a date string to a human-readable format. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(iso),
  );
}

/** Capitalise the first letter of a string. */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert a slug to a display label ("real-madrid" → "Real Madrid"). */
export function slugToLabel(slug: string): string {
  return slug.split('-').map(capitalize).join(' ');
}
