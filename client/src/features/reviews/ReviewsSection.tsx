import { useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { reviewApi } from '../../services/api';
import { extractErrorMessage } from '../../services/api/client';
import { theme } from '../../config/theme';
import type { CreateReviewPayload, Review } from '../../types';
import type { ProductReviewsState } from './useProductReviews';

interface ReviewsSectionProps {
  productId: string;
  state:     ProductReviewsState;
}

export function ReviewsSection({ productId, state }: ReviewsSectionProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { reviews, loading, error, average, refresh } = state;

  return (
    <section className="mt-12 border-t border-stroke pt-10">
      <header className="flex items-baseline justify-between mb-6">
        <h2 className={theme.sectionTitle}>Reviews</h2>
        {reviews.length > 0 && (
          <span className="text-sm text-muted">
            {average.toFixed(1)} ★ from {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {user && (
        <ReviewForm
          productId={productId}
          userId={user.id}
          existing={reviews.find((r) => r.userId === user.id) ?? null}
          onSaved={refresh}
        />
      )}

      {loading && <p className="text-muted text-sm">Loading reviews…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-muted text-sm">No reviews yet — be the first to share your experience.</p>
      )}

      <ul className="space-y-4 mt-6">
        {reviews.map((review) => (
          <li key={review.id} className="bg-surface border border-stroke rounded-2xl p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-semibold text-primary">{review.title ?? 'Review'}</span>
              <span className="text-amber-500 text-sm" aria-label={`${review.rating} stars`}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </span>
            </div>
            {review.comment && <p className="text-secondary text-sm">{review.comment}</p>}
            {review.isVerifiedPurchase && (
              <span className="inline-block mt-2 text-[10px] uppercase tracking-widest text-emerald-600">
                Verified purchase
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ReviewFormProps {
  productId: string;
  userId:    string;
  existing:  Review | null;
  onSaved:   () => void;
}

function ReviewForm({ productId, userId, existing, onSaved }: ReviewFormProps) {
  const [rating,  setRating]  = useState(existing?.rating ?? 5);
  const [title,   setTitle]   = useState(existing?.title ?? '');
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (existing) {
        await reviewApi.update(existing.id, { rating, title, comment });
      } else {
        const payload: CreateReviewPayload = { userId, productId, rating, title, comment };
        await reviewApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-surface border border-stroke rounded-2xl p-4 mb-6 space-y-3">
      <p className="text-sm font-semibold text-primary">{existing ? 'Update your review' : 'Write a review'}</p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="text-2xl text-amber-500"
          >
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full bg-surface-raised border border-stroke rounded-xl px-3 py-2 text-sm"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell other fans about the fit, quality, materials…"
        rows={3}
        className="w-full bg-surface-raised border border-stroke rounded-xl px-3 py-2 text-sm"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold uppercase tracking-wider disabled:opacity-60"
      >
        {submitting ? 'Saving…' : existing ? 'Update review' : 'Submit review'}
      </button>
    </form>
  );
}
