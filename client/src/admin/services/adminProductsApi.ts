import { productApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { decodeProductTags, encodeProductTags } from '../../features/products/lib/productMeta';
import type { AdminProduct, Attachment, CreateProductPayload, Product, ProductVariant } from '../../types';

/**
 * Bridge between the admin's AdminProduct (UI shape) and the backend's
 * Product + ProductVariant + Attachment trio. UI-only fields encode as
 * `key:value` strings in `tags[]` — see `productMeta.ts` for the round-trip.
 */

function variantSize(variant: ProductVariant, slug: string): string {
  const prefix = `${slug}-`;
  return variant.sku.startsWith(prefix) ? variant.sku.slice(prefix.length) : variant.sku;
}

function productToAdmin(product: Product, variants: ProductVariant[], images: string[]): AdminProduct {
  const meta = decodeProductTags(product.tags ?? []);
  return {
    id:            product.id,
    name:          product.title,
    slug:          product.slug,
    sport:         meta.sport,
    team:          meta.team,
    category:      meta.category,
    price:         product.basePrice,
    originalPrice: meta.originalPrice,
    currency:      meta.currency,
    images,
    description:   product.fullDescription ?? product.shortDescription ?? '',
    features:      meta.features,
    tags:          meta.tags,
    badge:         meta.badge,
    printable:     meta.printable,
    variants:      variants.map((v) => ({ size: variantSize(v, product.slug), stock: v.stockQuantity })),
    inStock:       variants.some((v) => v.stockQuantity > 0),
    rating:        0,
    reviewCount:   0,
    createdAt:     product.createdAt,
  };
}

function adminToProductPayload(admin: AdminProduct, categoryId: string, createdBy: string): CreateProductPayload {
  return {
    categoryId,
    title:            admin.name,
    slug:             admin.slug,
    shortDescription: admin.description,
    fullDescription:  admin.description,
    tags:             encodeProductTags(admin),
    basePrice:        admin.price,
    status:           'active',
    featured:         false,
    createdBy,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function safeListImages(productId: string): Promise<Attachment[]> {
  try { return await productApi.images.list(productId); } catch { return []; }
}

async function safeListVariants(productId: string): Promise<ProductVariant[]> {
  try { return await productApi.variants.list(productId); } catch { return []; }
}

function attachmentsToUrls(attachments: Attachment[]): string[] {
  return [...attachments]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => a.compressedFileUrl ?? a.fileUrl);
}

// ─── public surface ───────────────────────────────────────────────────────────

export interface AdminProductRow extends AdminProduct {
  /** Server attachment ids — used by update/delete flows to know what's persisted. */
  imageAttachmentIds: string[];
  /** Server variant ids keyed by size — used to update stock and delete obsolete sizes. */
  variantIdsBySize:   Record<string, string>;
  /** Backend category UUID — surfaced so update/save can keep using it. */
  categoryId:         string;
}

export interface UpsertProductInput extends AdminProduct {
  /** New image files awaiting upload (objectURL preview). */
  newImageFiles: File[];
  /** Server attachment IDs the user removed. */
  removedImageIds: string[];
  /** Backend category id for create flow. */
  categoryId: string;
}

export const adminProductsApi = {
  async list(): Promise<AdminProductRow[]> {
    const products = await productApi.search({});
    const enriched = await Promise.all(products.map(async (p) => {
      const [images, variants] = await Promise.all([
        safeListImages(p.id),
        safeListVariants(p.id),
      ]);
      const admin = productToAdmin(p, variants, attachmentsToUrls(images));
      return {
        ...admin,
        categoryId:         p.categoryId,
        imageAttachmentIds: images
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((a) => a.id),
        variantIdsBySize:   Object.fromEntries(
          variants.map((v) => [variantSize(v, p.slug), v.id]),
        ),
      } satisfies AdminProductRow;
    }));
    return enriched;
  },

  async getById(id: string): Promise<AdminProductRow | null> {
    try {
      const product = await productApi.byId(id);
      const [images, variants] = await Promise.all([
        safeListImages(product.id),
        safeListVariants(product.id),
      ]);
      const admin = productToAdmin(product, variants, attachmentsToUrls(images));
      return {
        ...admin,
        categoryId:         product.categoryId,
        imageAttachmentIds: images.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((a) => a.id),
        variantIdsBySize:   Object.fromEntries(variants.map((v) => [variantSize(v, product.slug), v.id])),
      } satisfies AdminProductRow;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Could not load product'));
    }
  },

  async create(input: UpsertProductInput, createdBy: string): Promise<Product> {
    const payload = adminToProductPayload(input, input.categoryId, createdBy);
    const product = await productApi.create(payload, input.newImageFiles);

    for (const variant of input.variants.filter((v) => v.stock > 0)) {
      await productApi.variants.create(product.id, {
        sku:           `${input.slug}-${variant.size}`,
        stockQuantity: variant.stock,
      });
    }

    return product;
  },

  async update(id: string, input: UpsertProductInput, existing: AdminProductRow): Promise<Product> {
    const payload = adminToProductPayload(input, input.categoryId || existing.categoryId, '');
    const { createdBy: _ignore, ...patch } = payload as CreateProductPayload & { createdBy?: string };
    void _ignore;
    const product = await productApi.update(id, patch);

    // Image deltas
    for (const removedId of input.removedImageIds) {
      await productApi.images.remove(removedId).catch(() => undefined);
    }
    for (let i = 0; i < input.newImageFiles.length; i++) {
      const file = input.newImageFiles[i];
      const sortOrder = existing.imageAttachmentIds.length - input.removedImageIds.length + i;
      await productApi.images.create(id, file, sortOrder).catch(() => undefined);
    }

    // Variant deltas: update existing sizes, create new ones, deactivate removed sizes
    const wantSizes = new Set(input.variants.filter((v) => v.stock > 0).map((v) => v.size));
    for (const variant of input.variants) {
      const variantId = existing.variantIdsBySize[variant.size];
      if (variantId) {
        await productApi.variants.setStock(variantId, variant.stock).catch(() => undefined);
      } else if (variant.stock > 0) {
        await productApi.variants.create(id, {
          sku:           `${input.slug}-${variant.size}`,
          stockQuantity: variant.stock,
        }).catch(() => undefined);
      }
    }
    for (const [size, variantId] of Object.entries(existing.variantIdsBySize)) {
      if (!wantSizes.has(size)) {
        await productApi.variants.deactivate(variantId).catch(() => undefined);
      }
    }

    return product;
  },

  async remove(id: string): Promise<void> {
    await productApi.delete(id);
  },

  async setStock(productId: string, variants: AdminProduct['variants'], existing: AdminProductRow): Promise<void> {
    for (const variant of variants) {
      const variantId = existing.variantIdsBySize[variant.size];
      if (variantId) {
        await productApi.variants.setStock(variantId, variant.stock).catch(() => undefined);
      } else if (variant.stock > 0) {
        await productApi.variants.create(productId, {
          sku:           `${existing.slug}-${variant.size}`,
          stockQuantity: variant.stock,
        }).catch(() => undefined);
      }
    }
  },
};
