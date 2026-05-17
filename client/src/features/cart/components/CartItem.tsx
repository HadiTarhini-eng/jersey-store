import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../../../utils/formatters';
import { productPath } from '../../../config/routes';
import type { CartItem as CartItemType } from '../../../types';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { remove, setQty } = useCart();
  const [imgError, setImgError] = useState(false);

  const title    = item.productTitle ?? 'Item';
  const image    = item.image;
  const variant  = item.variantLabel;
  const maxStock = item.maxStock ?? Number.POSITIVE_INFINITY;
  const linkTo   = productPath(item.productVariantId);

  return (
    <div className="flex gap-3 py-4 border-b border-stroke">
      <Link
        to={linkTo}
        className="shrink-0 w-16 h-20 rounded-xl bg-surface-raised overflow-hidden flex items-center justify-center"
      >
        {!image || imgError ? (
          <span className="text-2xl select-none" aria-hidden="true">👕</span>
        ) : (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={linkTo}
          className="text-sm font-semibold text-primary leading-snug hover:text-accent transition-colors line-clamp-2 block"
        >
          {title}
        </Link>

        {variant && (
          <p className="text-xs text-muted mt-1">
            <span className="text-accent font-semibold">{variant}</span>
          </p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-sm font-bold text-primary">
            {formatPrice(item.priceAtTime * item.quantity)}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                item.quantity > 1
                  ? setQty(item.productVariantId, item.quantity - 1)
                  : remove(item.productVariantId)
              }
              aria-label="Decrease quantity"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-stroke text-muted hover:border-accent hover:text-primary transition-colors text-sm"
            >
              −
            </button>

            <span className="text-sm font-semibold text-primary min-w-[1.5rem] text-center">
              {item.quantity}
            </span>

            <button
              onClick={() => setQty(item.productVariantId, item.quantity + 1)}
              disabled={item.quantity >= maxStock}
              aria-label="Increase quantity"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-stroke text-muted hover:border-accent hover:text-primary transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => remove(item.productVariantId)}
        aria-label={`Remove ${title}`}
        className="shrink-0 self-start p-1.5 rounded-lg text-muted hover:text-danger transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
