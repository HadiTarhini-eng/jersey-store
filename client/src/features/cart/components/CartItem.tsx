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

  return (
    <div className="flex gap-3 py-4 border-b border-stroke">
      {/* Product image */}
      <Link
        to={productPath(item.productId)}
        className="shrink-0 w-16 h-20 rounded-xl bg-surface-raised overflow-hidden flex items-center justify-center"
      >
        {imgError ? (
          <span className="text-2xl select-none" aria-hidden="true">👕</span>
        ) : (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <Link
          to={productPath(item.productId)}
          className="text-sm font-semibold text-primary leading-snug hover:text-accent transition-colors line-clamp-2 block"
        >
          {item.name}
        </Link>

        {/* Size */}
        <p className="text-xs text-muted mt-1">
          Size: <span className="text-accent font-semibold">{item.size}</span>
        </p>

        {/* Price + quantity row */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-sm font-bold text-primary">
            {formatPrice(item.price * item.quantity)}
          </span>

          {/* Quantity controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                item.quantity > 1
                  ? setQty(item.productId, item.size, item.quantity - 1)
                  : remove(item.productId, item.size)
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
              onClick={() => setQty(item.productId, item.size, item.quantity + 1)}
              disabled={item.quantity >= item.maxStock}
              aria-label="Increase quantity"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-stroke text-muted hover:border-accent hover:text-primary transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => remove(item.productId, item.size)}
        aria-label={`Remove ${item.name}`}
        className="shrink-0 self-start p-1.5 rounded-lg text-muted hover:text-danger transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
