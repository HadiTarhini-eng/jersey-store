import { useEffect, useState } from 'react';
import { categoryApi, offerApi, productApi } from '../../../services/api';
import type {
  Attachment, Category, Product, ProductAttribute, ProductSpecification, SpecialOffer,
} from '../../../types';

export interface ProductEnrichment {
  category:    Category | null;
  specs:       Array<{ id: string; label: string; value: string }>;
  offers:      SpecialOffer[];
  attachments: Attachment[];
  /** Products to render in the "Similar items" slider. Scored by tag overlap, same-category bias. */
  related:     Product[];
}

const EMPTY: ProductEnrichment = { category: null, specs: [], offers: [], attachments: [], related: [] };

/**
 * Score how similar `candidate` is to `current`. Same category counts heavily;
 * each overlapping tag adds a point. Used to rank the Similar Items slider.
 */
function similarityScore(currentTags: ReadonlySet<string>, currentCategoryId: string | undefined, candidate: Product): number {
  let score = 0;
  if (currentCategoryId && candidate.categoryId === currentCategoryId) score += 3;
  for (const t of candidate.tags ?? []) {
    if (currentTags.has(t)) score += 1;
  }
  return score;
}

/**
 * Sidecar hook for ProductDetailPage. Pulls the data the storefront would
 * otherwise need to inline-fetch on every render: category for breadcrumb,
 * specifications for the specs table, active offers for the offer pill,
 * and a tag-ranked "similar items" pool for the slider at the bottom of
 * the page. Failures are swallowed per-source so the page renders even
 * when a single endpoint is unhealthy.
 */
export function useProductEnrichment(
  productId: string | undefined,
  categoryId: string | undefined,
  tags: string[] | undefined,
) {
  const [data, setData] = useState<ProductEnrichment>(EMPTY);

  // useEffect depends on the tag list — stringify so an array identity change
  // alone doesn't re-fire the fetch.
  const tagsKey = JSON.stringify(tags ?? []);

  useEffect(() => {
    if (!productId) { setData(EMPTY); return; }
    let cancelled = false;

    (async () => {
      // Pull the broader catalogue once so the similar-items ranking can look
      // beyond the current category (matches by tag still surface). Cheap on a
      // small storefront catalogue; if this grows, swap to a backend endpoint.
      const [category, specsResult, offers, attributes, attachments, allProducts] = await Promise.all([
        categoryId ? categoryApi.byId(categoryId).catch(() => null) : Promise.resolve(null),
        productApi.specs.list(productId).catch(() => [] as ProductSpecification[]),
        offerApi.forProduct(productId).catch(() => [] as SpecialOffer[]),
        productApi.attributes.list().catch(() => [] as ProductAttribute[]),
        productApi.images.list(productId).catch(() => [] as Attachment[]),
        productApi.search({}).catch(() => [] as Product[]),
      ]);
      if (cancelled) return;

      const attrById = new Map(attributes.map((a) => [a.id, a]));
      const specs = specsResult.map((s) => ({
        id:    s.id,
        label: attrById.get(s.attributeId)?.name ?? 'Attribute',
        value: s.value,
      }));

      const sortedAttachments = [...attachments].sort((a, b) => a.sortOrder - b.sortOrder);

      // Rank by tag overlap + same-category bias. Drop the current product
      // and any zero-score candidates so the slider only shows real matches.
      const currentTags = new Set(tags ?? []);
      const related = allProducts
        .filter((p) => p.id !== productId)
        .map((p) => ({ p, score: similarityScore(currentTags, categoryId, p) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((entry) => entry.p);

      // Lazy image hydration — same approach productService.getProducts uses.
      const hydratedRelated = await Promise.all(
        related.map(async (p) => {
          if (p.images && p.images.length > 0) return p;
          try {
            const imgs = await productApi.images.list(p.id);
            const urls = imgs.slice().sort((a, b) => a.sortOrder - b.sortOrder)
              .map((a) => a.compressedFileUrl ?? a.fileUrl);
            return urls.length > 0 ? { ...p, images: urls } : p;
          } catch { return p; }
        }),
      );

      if (cancelled) return;
      setData({ category, specs, offers, attachments: sortedAttachments, related: hydratedRelated });
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, categoryId, tagsKey]);

  return data;
}
