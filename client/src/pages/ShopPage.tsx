import { useMemo } from 'react';
import { ProductGrid }    from '../features/products/components/ProductGrid';
import { ProductFilters } from '../features/products/components/ProductFilters';
import { ProductSearch }  from '../features/products/components/ProductSearch';
import { Select }         from '../components/ui/Select';
import { useProducts }    from '../features/products/hooks/useProducts';
import { useFilters }     from '../features/products/hooks/useFilters';
import { useCategories }  from '../features/products/hooks/useCategories';
import { useSiteConfig }  from '../contexts/SiteConfigContext';

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ShopPage() {
  const { filters, sort, setSort } = useFilters();
  const { categories } = useCategories();

  /**
   * Resolve the URL's `categoryId` to a real backend Category GUID.
   *
   * Two surfaces feed this param:
   *  - The home page's kit-category tiles, which fall back to the
   *    ui-content row's id when the admin hasn't bound the tile to a
   *    real product category (that id is a Guid but matches no products).
   *  - Direct URLs like `/shop?categoryId=jerseys` typed or shared by
   *    users, where the value is a category slug instead of a Guid.
   *
   * We resolve in this order: keep as-is if it's a valid Guid that
   * matches a category; otherwise try slug match; otherwise drop the
   * filter so the user at least sees products instead of an empty grid.
   */
  const resolvedFilters = useMemo(() => {
    const cid = filters.categoryId;
    if (!cid) return filters;

    // Already a known Guid → trust it.
    if (GUID_RE.test(cid) && categories.some((c) => c.id === cid)) {
      return filters;
    }

    // Try resolving against slug (case-insensitive).
    const lower = cid.toLowerCase();
    const bySlug = categories.find((c) => c.slug.toLowerCase() === lower);
    if (bySlug) {
      return { ...filters, categoryId: bySlug.id };
    }

    // Unknown id and unknown slug — categories may still be loading. Skip
    // the filter for now; once `categories` populates the memo re-runs.
    if (categories.length === 0) return filters;
    return { ...filters, categoryId: undefined };
  }, [filters, categories]);

  const { products, loading, error } = useProducts(resolvedFilters, sort);
  const { sortOptions } = useSiteConfig();

  const SortSelect = () => (
    <Select
      options={sortOptions}
      value={sort}
      onChange={(e) => setSort(e.target.value as Parameters<typeof setSort>[0])}
      aria-label="Sort products"
    />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">All Jerseys</h1>
        <p className="text-secondary text-sm mt-1">
          {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <ProductSearch />
      </div>

      {/* ── Mobile layout ────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Toolbar: filter trigger + sort */}
        <div className="flex items-center gap-3 mb-5">
          <ProductFilters />
          <div className="ml-auto w-40">
            <SortSelect />
          </div>
        </div>
        {/* Products — full width */}
        <ProductGrid products={products} loading={loading} error={error} />
      </div>

      {/* ── Desktop layout ───────────────────────────────────────────────────── */}
      <div className="hidden lg:flex gap-8 items-start">
        <ProductFilters />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-end mb-5">
            <div className="w-48">
              <SortSelect />
            </div>
          </div>
          <ProductGrid products={products} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
