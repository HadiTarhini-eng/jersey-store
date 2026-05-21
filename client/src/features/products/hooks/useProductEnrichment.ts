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
  related:     Product[];
}

const EMPTY: ProductEnrichment = { category: null, specs: [], offers: [], attachments: [], related: [] };

/**
 * Sidecar hook for ProductDetailPage. Pulls the data the storefront would
 * otherwise need to inline-fetch on every render: category for breadcrumb,
 * specifications for the specs table, active offers for the offer pill.
 * Failures are swallowed per-source so the page renders even when a single
 * endpoint is unhealthy.
 */
export function useProductEnrichment(productId: string | undefined, categoryId: string | undefined) {
  const [data, setData] = useState<ProductEnrichment>(EMPTY);

  useEffect(() => {
    if (!productId) { setData(EMPTY); return; }
    let cancelled = false;

    (async () => {
      const [category, specsResult, offers, attributes, attachments, related] = await Promise.all([
        categoryId ? categoryApi.byId(categoryId).catch(() => null) : Promise.resolve(null),
        productApi.specs.list(productId).catch(() => [] as ProductSpecification[]),
        offerApi.forProduct(productId).catch(() => [] as SpecialOffer[]),
        productApi.attributes.list().catch(() => [] as ProductAttribute[]),
        productApi.images.list(productId).catch(() => [] as Attachment[]),
        categoryId
          ? productApi.search({ categoryId }).catch(() => [] as Product[])
          : Promise.resolve([] as Product[]),
      ]);
      if (cancelled) return;

      const attrById = new Map(attributes.map((a) => [a.id, a]));
      const specs = specsResult.map((s) => ({
        id:    s.id,
        label: attrById.get(s.attributeId)?.name ?? 'Attribute',
        value: s.value,
      }));

      const sortedAttachments = [...attachments].sort((a, b) => a.sortOrder - b.sortOrder);
      const relatedFiltered = related.filter((p) => p.id !== productId).slice(0, 8);
      setData({ category, specs, offers, attachments: sortedAttachments, related: relatedFiltered });
    })();

    return () => { cancelled = true; };
  }, [productId, categoryId]);

  return data;
}
