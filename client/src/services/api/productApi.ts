import { http } from './client';
import { endpoints } from './endpoints';
import type {
  AssignAttributePayload, CreateAttributeOptionPayload,
  CreateProductPayload, CreateSpecificationPayload, CreateVariantPayload,
  Product, ProductAssignedAttribute, ProductAttribute, ProductAttributeOption,
  ProductSearchQuery, ProductSpecification, ProductVariant,
  UpdateProductPayload, VariantAttributeValue,
} from '../../types';

export const productApi = {
  // ── Products ────────────────────────────────────────────────────────────────
  create:    (body: CreateProductPayload)                  => http.post<Product>(endpoints.products.create(), body),
  search:    (query: ProductSearchQuery = {})              => http.get<Product[]>(endpoints.products.search(), { params: query }),
  byId:      (id: string)                                  => http.get<Product>(endpoints.products.byId(id)),
  bySlug:    (slug: string)                                => http.get<Product>(endpoints.products.bySlug(slug)),
  update:    (id: string, body: UpdateProductPayload)      => http.patch<Product>(endpoints.products.update(id), body),
  publish:   (id: string)                                  => http.post<Product>(endpoints.products.publish(id)),
  archive:   (id: string)                                  => http.post<Product>(endpoints.products.archive(id)),
  setFeatured:(id: string, featured: boolean)              => http.patch<Product>(endpoints.products.featured(id), { featured }),
  setPrice:  (id: string, basePrice: number)               => http.patch<Product>(endpoints.products.price(id), { basePrice }),
  delete:    (id: string)                                  => http.delete<void>(endpoints.products.delete(id)),

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
    create:        (productId: string, body: CreateVariantPayload) =>
                     http.post<ProductVariant>(endpoints.variants.create(productId), body),
    list:          (productId: string) => http.get<ProductVariant[]>(endpoints.variants.list(productId)),
    byId:          (id: string)        => http.get<ProductVariant>(endpoints.variants.byId(id)),
    bySku:         (sku: string)       => http.get<ProductVariant>(endpoints.variants.bySku(sku)),
    update:        (id: string, body: Partial<CreateVariantPayload>) =>
                     http.patch<ProductVariant>(endpoints.variants.update(id), body),
    setStock:      (id: string, stockQuantity: number) =>
                     http.patch<ProductVariant>(endpoints.variants.stock(id), { stockQuantity }),
    reserve:       (id: string, quantity: number) =>
                     http.post<ProductVariant>(endpoints.variants.reserve(id), { quantity }),
    setAttributes: (id: string, values: Omit<VariantAttributeValue, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'variantId'>[]) =>
                     http.put<VariantAttributeValue[]>(endpoints.variants.setAttributes(id), values),
    deactivate:    (id: string) => http.delete<ProductVariant>(endpoints.variants.deactivate(id)),
  },
};
