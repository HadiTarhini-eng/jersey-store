/**
 * Central URL registry — single source of truth for every backend route.
 * Mirrors api/src/infrastructure/http/routes/* exactly. If a route changes
 * upstream, update it here and the rest of the client follows.
 */

export const endpoints = {
  // ── Users / Auth ────────────────────────────────────────────────────────────
  users: {
    create:           ()                  => '/users',
    login:            ()                  => '/users/login',
    me:               ()                  => '/users/me',
    list:             ()                  => '/users',
    byId:             (id: string)        => `/users/${id}`,
    update:           (id: string)        => `/users/${id}`,
    changePassword:   (id: string)        => `/users/${id}/password`,
    changeRole:       (id: string)        => `/users/${id}/role`,
    profileImage:     (id: string)        => `/users/${id}/profile-image`,
    activate:         (id: string)        => `/users/${id}/activate`,
    deactivate:       (id: string)        => `/users/${id}`,
  },

  // ── Products ────────────────────────────────────────────────────────────────
  products: {
    create:    ()                  => '/products',
    search:    ()                  => '/products',
    byId:      (id: string)        => `/products/${id}`,
    bySlug:    (slug: string)      => `/products/slug/${slug}`,
    update:    (id: string)        => `/products/${id}`,
    publish:   (id: string)        => `/products/${id}/publish`,
    archive:   (id: string)        => `/products/${id}/archive`,
    featured:  (id: string)        => `/products/${id}/featured`,
    price:     (id: string)        => `/products/${id}/price`,
    delete:    (id: string)        => `/products/${id}`,
    images:    (productId: string) => `/products/${productId}/images`,
    imageById: (id: string)        => `/products/images/${id}`,
  },

  // ── Product Attributes ──────────────────────────────────────────────────────
  productAttributes: {
    create:        ()                       => '/product-attributes',
    list:          ()                       => '/product-attributes',
    update:        (id: string)             => `/product-attributes/${id}`,
    assign:        (productId: string)      => `/products/${productId}/assigned-attributes`,
    updateAssigned:(id: string)             => `/product-assigned-attributes/${id}`,
    removeAssigned:(id: string)             => `/product-assigned-attributes/${id}`,
    createOption:  (assignedId: string)     => `/product-assigned-attributes/${assignedId}/options`,
    listOptions:   (assignedId: string)     => `/product-assigned-attributes/${assignedId}/options`,
  },

  // ── Product Specifications ──────────────────────────────────────────────────
  productSpecs: {
    create: (productId: string) => `/products/${productId}/specifications`,
    list:   (productId: string) => `/products/${productId}/specifications`,
  },

  // ── Product Variants ────────────────────────────────────────────────────────
  variants: {
    create:        (productId: string) => `/products/${productId}/variants`,
    list:          (productId: string) => `/products/${productId}/variants`,
    byId:          (id: string)        => `/variants/${id}`,
    bySku:         (sku: string)       => `/variants/sku/${sku}`,
    update:        (id: string)        => `/variants/${id}`,
    image:         (id: string)        => `/variants/${id}/image`,
    stock:         (id: string)        => `/variants/${id}/stock`,
    reserve:       (id: string)        => `/variants/${id}/reserve`,
    setAttributes: (id: string)        => `/variants/${id}/attributes`,
    deactivate:    (id: string)        => `/variants/${id}`,
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  categories: {
    create:    ()           => '/categories',
    list:      ()           => '/categories',
    byId:      (id: string) => `/categories/${id}`,
    children:  (id: string) => `/categories/${id}/children`,
    update:    (id: string) => `/categories/${id}`,
    move:      (id: string) => `/categories/${id}/move`,
    image:     (id: string) => `/categories/${id}/image`,
    activate:  (id: string) => `/categories/${id}/activate`,
    delete:    (id: string) => `/categories/${id}`,
  },

  categoryTypes: {
    create: ()           => '/category-types',
    list:   ()           => '/category-types',
    byId:   (id: string) => `/category-types/${id}`,
    update: (id: string) => `/category-types/${id}`,
    delete: (id: string) => `/category-types/${id}`,
  },

  // ── Carts ───────────────────────────────────────────────────────────────────
  carts: {
    create:      ()                  => '/carts',
    forUser:     (userId: string)    => `/users/${userId}/cart`,
    addItem:     (cartId: string)    => `/carts/${cartId}/items`,
    listItems:   (cartId: string)    => `/carts/${cartId}/items`,
    updateItem:  (itemId: string)    => `/cart-items/${itemId}`,
    removeItem:  (itemId: string)    => `/cart-items/${itemId}`,
    abandon:     (id: string)        => `/carts/${id}/abandon`,
    convert:     (id: string)        => `/carts/${id}/convert`,
  },

  // ── Orders ──────────────────────────────────────────────────────────────────
  orders: {
    create:        ()                      => '/orders',
    byId:          (id: string)            => `/orders/${id}`,
    byNumber:      (n: string)             => `/orders/number/${n}`,
    forUser:       (userId: string)        => `/users/${userId}/orders`,
    items:         (id: string)            => `/orders/${id}/items`,
    place:         (id: string)            => `/orders/${id}/place`,
    status:        (id: string)            => `/orders/${id}/status`,
    payment:       (id: string)            => `/orders/${id}/payment`,
    addresses:     (id: string)            => `/orders/${id}/addresses`,
    cancel:        (id: string)            => `/orders/${id}/cancel`,
  },

  // ── Reviews ─────────────────────────────────────────────────────────────────
  reviews: {
    create:       ()                  => '/reviews',
    byId:         (id: string)        => `/reviews/${id}`,
    forProduct:   (productId: string) => `/products/${productId}/reviews`,
    forUser:      (userId: string)    => `/users/${userId}/reviews`,
    update:       (id: string)        => `/reviews/${id}`,
    verify:       (id: string)        => `/reviews/${id}/verify-purchase`,
    delete:       (id: string)        => `/reviews/${id}`,
  },

  // ── Offers ──────────────────────────────────────────────────────────────────
  offers: {
    create:      ()                  => '/offers',
    active:      ()                  => '/offers/active',
    byId:        (id: string)        => `/offers/${id}`,
    forProduct:  (productId: string) => `/products/${productId}/offers`,
    update:      (id: string)        => `/offers/${id}`,
    attach:      (offerId: string, productId: string) => `/offers/${offerId}/products/${productId}`,
    detach:      (offerId: string, productId: string) => `/offers/${offerId}/products/${productId}`,
    schedule:    (id: string)        => `/offers/${id}/schedule`,
    banner:      (id: string)        => `/offers/${id}/banner`,
    activate:    (id: string)        => `/offers/${id}/activate`,
    deactivate:  (id: string)        => `/offers/${id}`,
  },

  // ── Attachments ─────────────────────────────────────────────────────────────
  attachments: {
    create:   ()                  => '/attachments',
    byId:     (id: string)        => `/attachments/${id}`,
    forUser:  (userId: string)    => `/users/${userId}/attachments`,
    rename:   (id: string)        => `/attachments/${id}/name`,
    replace:  (id: string)        => `/attachments/${id}/file`,
    delete:   (id: string)        => `/attachments/${id}`,
  },
} as const;
