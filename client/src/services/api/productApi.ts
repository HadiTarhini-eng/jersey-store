import { http, toFormData, UPLOAD_CONFIG } from './client';
import { endpoints } from './endpoints';
import type {
  AssignAttributePayload, Attachment, BulkPricingItem, CreateAttributeOptionPayload,
  CreateProductPayload, CreateSpecificationPayload, CreateVariantPayload,
  Product, ProductAssignedAttribute, ProductAttribute, ProductAttributeOption,
  ProductSearchQuery, ProductSpecification, ProductVariant,
  UpdateProductPayload, VariantAttributeValue,
} from '../../types';

export const productApi = {
  // ── Products ────────────────────────────────────────────────────────────────
  /**
   * Multipart create: `data` is the JSON-encoded product fields, `gallery` is
   * a list of image files. The first file becomes the primary cover image.
   */
  create: (body: CreateProductPayload, gallery: File[] = []) => {
    const form = new FormData();
    form.append('data', JSON.stringify(body));
    for (const file of gallery) form.append('gallery', file);
    return http.post<Product>(endpoints.products.create(), form, UPLOAD_CONFIG);
  },
  search:    (query: ProductSearchQuery = {})              => http.get<Product[]>(endpoints.products.search(), { params: query }),
  byId:      (id: string)                                  => http.get<Product>(endpoints.products.byId(id)),
  bySlug:    (slug: string)                                => http.get<Product>(endpoints.products.bySlug(slug)),
  update:    (id: string, body: UpdateProductPayload)      => http.patch<Product>(endpoints.products.update(id), body),
  publish:   (id: string)                                  => http.post<Product>(endpoints.products.publish(id)),
  archive:   (id: string)                                  => http.post<Product>(endpoints.products.archive(id)),
  setFeatured:(id: string, featured: boolean)              => http.patch<Product>(endpoints.products.featured(id), { featured }),
  setPrice:  (id: string, basePrice: number)               => http.patch<Product>(endpoints.products.price(id), { basePrice }),
  /**
   * Atomic bulk pricing update — server-side transaction over many products
   * at once. Replaces the N-parallel-PATCH pattern in the admin discount
   * workbench so the entire batch succeeds or fails together.
   */
  bulkPricing: (items: BulkPricingItem[])                  => http.post<Product[]>(endpoints.products.bulkPricing(), { items }),
  delete:    (id: string)                                  => http.delete<void>(endpoints.products.delete(id)),
  images: {
    /**
     * Multipart upload — adds a single image to a product's gallery.
     * `sortOrder` defaults to 0 (primary cover) if omitted.
     */
    create: (productId: string, file: File | Blob, sortOrder = 0, fileName = 'product-image') =>
      http.post<Attachment>(
        endpoints.products.images(productId),
        toFormData({
          file:      file instanceof File ? file : new File([file], fileName),
          sortOrder: String(sortOrder),
        }),
        UPLOAD_CONFIG,
      ),
    list:   (productId: string) => http.get<Attachment[]>(endpoints.products.images(productId)),
    // Gallery images are attachments — removal goes through the canonical
    // `DELETE /attachments/:id` route (there is no `/products/images/:id`).
    remove: (id: string)        => http.delete<void>(endpoints.attachments.delete(id)),
  },

  // ── Attributes ──────────────────────────────────────────────────────────────
  attributes: {
    create:         (body: Omit<ProductAttribute, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) =>
                      http.post<ProductAttribute>(endpoints.productAttributes.create(), body),
    list:           () => http.get<ProductAttribute[]>(endpoints.productAttributes.list()),
    update:         (id: string, body: Partial<ProductAttribute>) =>
                      http.patch<ProductAttribute>(endpoints.productAttributes.update(id), body),
    assign:         (productId: string, body: AssignAttributePayload) =>
                      http.post<ProductAssignedAttribute>(endpoints.productAttributes.assign(productId), body),
    updateAssigned: (id: string, body: Partial<AssignAttributePayload>) =>
                      http.patch<ProductAssignedAttribute>(endpoints.productAttributes.updateAssigned(id), body),
    removeAssigned: (id: string) => http.delete<void>(endpoints.productAttributes.removeAssigned(id)),
    createOption:   (assignedId: string, body: CreateAttributeOptionPayload) =>
                      http.post<ProductAttributeOption>(endpoints.productAttributes.createOption(assignedId), body),
    listOptions:    (assignedId: string) =>
                      http.get<ProductAttributeOption[]>(endpoints.productAttributes.listOptions(assignedId)),
  },

  // ── Specifications ──────────────────────────────────────────────────────────
  specs: {
    create: (productId: string, body: CreateSpecificationPayload) =>
              http.post<ProductSpecification>(endpoints.productSpecs.create(productId), body),
    list:   (productId: string) =>
              http.get<ProductSpecification[]>(endpoints.productSpecs.list(productId)),
  },

  // ── Variants ────────────────────────────────────────────────────────────────
  variants: {
    /** Multipart create. The optional `image` is uploaded alongside the variant data. */
    create: (productId: string, body: CreateVariantPayload, image?: File | Blob) => {
      const form = new FormData();
      form.append('data', JSON.stringify(body));
      if (image) form.append('image', image instanceof File ? image : new File([image], 'variant-image'));
      return http.post<ProductVariant>(endpoints.variants.create(productId), form, UPLOAD_CONFIG);
    },
    list:          (productId: string) => http.get<ProductVariant[]>(endpoints.variants.list(productId)),
    byId:          (id: string)        => http.get<ProductVariant>(endpoints.variants.byId(id)),
    bySku:         (sku: string)       => http.get<ProductVariant>(endpoints.variants.bySku(sku)),
    update:        (id: string, body: Partial<CreateVariantPayload>) =>
                     http.patch<ProductVariant>(endpoints.variants.update(id), body),
    setImage:      (id: string, file: File | Blob, fileName = 'variant-image') =>
                     http.post<ProductVariant>(
                       endpoints.variants.image(id),
                       toFormData({ file: file instanceof File ? file : new File([file], fileName) }),
                       UPLOAD_CONFIG,
                     ),
    removeImage:   (id: string) => http.delete<ProductVariant>(endpoints.variants.image(id)),
    setStock:      (id: string, stockQuantity: number) =>
                     http.patch<ProductVariant>(endpoints.variants.stock(id), { stockQuantity }),
    reserve:       (id: string, quantity: number) =>
                     http.post<ProductVariant>(endpoints.variants.reserve(id), { quantity }),
    setAttributes: (id: string, values: Omit<VariantAttributeValue, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'variantId'>[]) =>
                     http.put<VariantAttributeValue[]>(endpoints.variants.setAttributes(id), values),
    deactivate:    (id: string) => http.delete<ProductVariant>(endpoints.variants.deactivate(id)),
  },
};
