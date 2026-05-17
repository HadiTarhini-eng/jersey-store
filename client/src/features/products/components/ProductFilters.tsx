import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useFilters } from '../hooks/useFilters';
import type { Sport, Team, UiCategory } from '../../../types';
import sportsData     from '../../../data/sports.json';
import teamsData      from '../../../data/teams.json';
import categoriesData from '../../../data/categories.json';
import uiConfig       from '../../../data/ui-config.json';

/** Sidebar filter panel — collapses to a modal trigger on mobile. */
export function ProductFilters() {
  const { filters, sort, setFilter, clearFilters, setSort, activeFilterCount } = useFilters();
  const [isMobileOpen, setMobileOpen] = useState(false);

  const sports     = sportsData     as Sport[];
  const teams      = teamsData      as Team[];
  const categories = categoriesData as UiCategory[];

  // Only show teams for the selected sport
  const visibleTeams = filters.sport
    ? teams.filter((t) => t.sport === filters.sport)
    : teams;

  const { priceRange, sortOptions } = uiConfig.filters;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort */}
      <FilterSection title="Sort By">
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value as any)}
              className={[
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                sort === opt.value
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-secondary hover:text-primary hover:bg-surface-raised',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sport */}
      <FilterSection title="Sport">
        <div className="space-y-1">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setFilter('sport', filters.sport === sport.id ? undefined : sport.id)}
              className={[
                'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                filters.sport === sport.id
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-secondary hover:text-primary hover:bg-surface-raised',
              ].join(' ')}
            >
              <span>{sport.icon}</span>
              {sport.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter('categoryId', filters.categoryId === cat.id ? undefined : cat.id)}
              className={[
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                filters.categoryId === cat.id
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-secondary hover:text-primary hover:bg-surface-raised',
              ].join(' ')}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Team */}
      {visibleTeams.length > 0 && (
        <FilterSection title="Team">
          <div className="space-y-1 max-h-52 overflow-y-auto hide-scrollbar">
            {visibleTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => setFilter('team', filters.team === team.id ? undefined : team.id)}
                className={[
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  filters.team === team.id
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-secondary hover:text-primary hover:bg-surface-raised',
                ].join(' ')}
              >
                {team.name}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={priceRange.min}
              max={filters.maxPrice ?? priceRange.max}
              value={filters.minPrice ?? priceRange.min}
              onChange={(e) => setFilter('minPrice', e.target.value || undefined)}
              placeholder="Min"
              className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-stroke text-primary text-sm outline-none focus:border-accent"
            />
            <span className="text-muted text-sm shrink-0">to</span>
            <input
              type="number"
              min={filters.minPrice ?? priceRange.min}
              max={priceRange.max}
              value={filters.maxPrice ?? priceRange.max}
              onChange={(e) => setFilter('maxPrice', e.target.value || undefined)}
              placeholder="Max"
              className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-stroke text-primary text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      </FilterSection>

      {/* In stock only */}
      <FilterSection title="Availability">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={!!filters.inStock}
              onChange={(e) => setFilter('inStock', e.target.checked ? 'true' : undefined)}
              className="sr-only"
            />
            <div className={[
              'w-9 h-5 rounded-full transition-colors',
              filters.inStock ? 'bg-accent' : 'bg-stroke',
            ].join(' ')} />
            <div className={[
              'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
              filters.inStock ? 'translate-x-4' : '',
            ].join(' ')} />
          </div>
          <span className="text-sm text-secondary group-hover:text-primary transition-colors">
            In stock only
          </span>
        </label>
      </FilterSection>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" fullWidth onClick={clearFilters}>
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(true)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
        >
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>

        {/* Mobile drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-background/90" onClick={() => setMobileOpen(false)} />
            <aside className="relative ml-auto w-80 max-w-[90vw] h-full bg-surface-raised border-l border-stroke overflow-y-auto animate-slide-in-right">
              <div className="sticky top-0 bg-surface border-b border-stroke px-5 py-4 flex items-center justify-between">
                <h2 className="font-semibold text-primary">Filters</h2>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-raised">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-5"><FilterContent /></div>
            </aside>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-24">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">Filters</h2>
          <FilterContent />
        </div>
      </aside>
    </>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-stroke pb-5">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-muted group-hover:text-primary transition-colors">
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && children}
    </div>
  );
}
