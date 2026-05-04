/** Central route path definitions — import from here, never hardcode paths. */
export const ROUTES = {
  HOME:           '/',
  SHOP:           '/shop',
  PRODUCT:        '/shop/:slug',
  CART:           '/cart',
  CHECKOUT:       '/checkout',
  LOGIN:          '/login',
  REGISTER:       '/register',
  PROFILE:        '/profile',
  NOT_FOUND:      '*',
} as const;

/** Build a product detail URL from a slug. */
export const productPath = (slug: string) => `/shop/${slug}`;
