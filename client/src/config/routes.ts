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
  ORDERS:         '/orders',
  ORDER_DETAIL:   '/orders/:id',
  FAVORITES:      '/favorites',
  // Static content / info pages
  FAQ:            '/faq',
  SHIPPING:       '/shipping-policy',
  RETURNS:        '/returns',
  SIZE_GUIDE:     '/size-guide',
  CONTACT:        '/contact',
  ABOUT:          '/about',
  COMPANY:        '/company',
  PRIVACY:        '/privacy',
  TERMS:          '/terms',
  NOT_FOUND:      '*',
} as const;

/** Build a product detail URL from a slug. */
export const productPath = (slug: string) => `/shop/${slug}`;

/** Build a customer order detail URL from an order id. */
export const orderPath = (id: string) => `/orders/${id}`;
