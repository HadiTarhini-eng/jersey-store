import { useCallback, useEffect, useState } from 'react';
import { reviewApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import type { Review } from '../../types';

export interface ProductReviewsState {
  reviews: Review[];
  loading: boolean;
  error:   string | null;
  average: number;
  count:   number;
  refresh: () => Promise<void>;
}

/**
 * Single source of truth for a product's review list. Both the rating row
 * on the product header and the ReviewsSection consume this so the average
 * never disagrees with the visible list.
 */
export function useProductReviews(productId: string): ProductReviewsState {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      setReviews(await reviewApi.forProduct(productId));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { refresh(); }, [refresh]);

  const count   = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  return { reviews, loading, error, average, count, refresh };
}
