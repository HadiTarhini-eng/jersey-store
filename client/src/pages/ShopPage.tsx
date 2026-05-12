import { ProductGrid }    from '../features/products/components/ProductGrid';
import { ProductFilters } from '../features/products/components/ProductFilters';
import { ProductSearch }  from '../features/products/components/ProductSearch';
import { Select }         from '../components/ui/Select';
import { useProducts }    from '../features/products/hooks/useProducts';
import { useFilters }     from '../features/products/hooks/useFilters';
import uiConfig from '../data/ui-config.json';

export function ShopPage() {
  const { filters, sort, setSort } = useFilters();
  const { products, loading, error } = useProducts(filters, sort);
  const sortOptions = uiConfig.filters.sortOptions;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">All Jerseys</h1>
        <p className="text-secondary text-sm mt-1">
          {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="mb-6">
        <ProductSearch />
      </div>

      <div className="flex gap-8 items-start">
        <ProductFilters />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-end mb-5">
            <div className="w-48">
              <Select
                options={sortOptions}
                value={sort}
                onChange={(e) => setSort(e.target.value as Parameters<typeof setSort>[0])}
                aria-label="Sort products"
              />
            </div>
          </div>

          <ProductGrid products={products} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
