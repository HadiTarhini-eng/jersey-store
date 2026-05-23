import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../features/wishlist/useWishlist';
import { ProductCard } from '../features/products/components/ProductCard';
import { productService } from '../services/productService';
import { theme } from '../config/theme';
import { ROUTES } from '../config/routes';
import type { Product } from '../types';

export function FavoritesPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    (async () => {
      const results = await Promise.all(
        ids.map((id) => productService.getProductById(id).catch(() => null)),
      );
      if (!cancelled) {
        setProducts(results.filter((p): p is Product => p !== null));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ids]);

  return (
    <main className={`${theme.pageContainer} py-8 lg:py-12 space-y-6`}>
      <header>
        <h1 className="font-sport text-4xl md:text-5xl tracking-tight text-primary">Favorites</h1>
        <p className="text-sm text-muted mt-1">
          The pieces you've saved — ready when you are.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full border border-stroke bg-surface-raised flex items-center justify-center">
        <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
      </div>
      <div>
        <h2 className="text-primary font-semibold">No favorites yet</h2>
        <p className="text-sm text-muted mt-1">Tap the heart on any product to save it here.</p>
      </div>
      <Link to={ROUTES.SHOP} className={theme.btnPrimary}>
        Browse the shop
      </Link>
    </div>
  );
}
