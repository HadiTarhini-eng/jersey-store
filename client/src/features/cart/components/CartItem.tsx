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

  return (
    <div className="flex gap-3 py-4 border-b border-stroke last:border-0">
      {/* Product image */}
      <Link
        to={productPath(item.productId)}
        className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-raised overflow-hidden border border-stroke"
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          to={productPath(item.productId)}
          className="text-sm font-medium text-primary leading-snug hover:text-accent transition-colors line-clamp-2"
        >
          {item.name}
        </Link>

        <p className="text-xs text-muted mt-0.5">Size: {item.size}</p>

        <div className="flex items-center justify-between mt-2.5">
          {/* Quantity control */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                item.quantity > 1
                  ? setQty(item.productId, item.size, item.quantity - 1)
                  : remove(item.productId, item.size)
              }
              aria-label="Decrease quantity"
              className="w-6 h-6 flex items-center justify-center rounded-md border border-stroke text-muted hover:text-primary hover:border-accent/50 transition-colors text-sm"
            >
              −
            </button>
            <span className="text-sm font-medium text-primary w-5 text-center">{item.quantity}</span>
            <button
              onClick={() => setQty(item.productId, item.size, item.quantity + 1)}
              disabled={item.quantity >= item.maxStock}
              aria-label="Increase quantity"
              className="w-6 h-6 flex items-center justify-center rounded-md border border-stroke text-muted hover:text-primary hover:border-accent/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>

          <span className="text-sm font-semibold text-primary">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => remove(item.productId, item.size)}
        aria-label={`Remove ${item.name}`}
        className="shrink-0 self-start p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
