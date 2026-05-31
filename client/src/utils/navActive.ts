/**
 * Whether a nav link's href is "active" for the current location, taking the
 * query string into account.
 *
 * React-Router's <NavLink> matches on **pathname only**, so every link that
 * points at `/shop?...` (New Arrivals, Sale, Football, …) lights up together
 * on any `/shop` page. This matcher compares the path AND requires every query
 * param in the href to be present with the same value in the current URL:
 *
 *  - Bare links (no query, e.g. `/shop`) are active only when the current URL
 *    has no query params either.
 *  - Parametered links (e.g. `/shop?badge=New`) are active when their params
 *    are a subset of the current URL's params — so adding a `sort` param, etc.
 *    doesn't drop the highlight.
 */
export function isNavLinkActive(
  href: string,
  location: { pathname: string; search: string },
): boolean {
  const [rawPath, rawQuery = ''] = href.split('?');
  const path = rawPath || '/';
  if (location.pathname !== path) return false;

  const linkEntries = [...new URLSearchParams(rawQuery)];
  const curParams = new URLSearchParams(location.search);

  if (linkEntries.length === 0) {
    // Bare path — active only when no query params are applied.
    return [...curParams].length === 0;
  }
  return linkEntries.every(([key, value]) => curParams.get(key) === value);
}
