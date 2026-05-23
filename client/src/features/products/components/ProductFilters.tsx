import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useFilters } from '../hooks/useFilters';
import { useCategories } from '../hooks/useCategories';
import type { Sport, Team } from '../../../types';
import sportsData     from '../../../data/sports.json';
import teamsData      from '../../../data/teams.json';
import uiConfig       from '../../../data/ui-config.json';

/** Sidebar filter panel — collapses to a modal trigger on mobile. */
export function ProductFilters() {
  const { filters, sort, setFilter, clearFilters, setSort, activeFilterCount } = useFilters();
  const [isMobileOpen, setMobileOpen] = useState(false);

  const sports = sportsData as Sport[];
  const teams  = teamsData  as Team[];
  const { categories } = useCategories();

  // Only show teams for the selected sport
  const visibleTeams = filters.sport
    ? teams.filter((t) => t.sport === filters.sport)
    : teams;

  const { priceRange, sortOptions } = uiConfig.filters;
  const optionClass = 'w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-white transition-colors';
  const activeOptionClass = 'bg-accent text-black font-bold shadow-lg shadow-accent/30';
  const idleOptionClass = 'hover:bg-white/10';

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
                optionClass,
                sort === opt.value
                  ? activeOptionClass
                  : idleOptionClass,
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
                `${optionClass} flex items-center gap-2.5`,
                filters.sport === sport.id
                  ? activeOptionClass
                  : idleOptionClass,
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
                optionClass,
                filters.categoryId === cat.id
                  ? activeOptionClass
                  : idleOptionClass,
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
                  optionClass,
                  filters.team === team.id
                    ? activeOptionClass
                    : idleOptionClass,
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
        <div className="flex items-stretch gap-2">
          <PriceInput
            label="Min"
            value={filters.minPrice ?? ''}
            onChange={(val) => setFilter('minPrice', val || undefined)}
            min={priceRange.min}
            max={filters.maxPrice ?? priceRange.max}
            placeholder={String(priceRange.min)}
          />
          <span className="self-center text-white/40 text-xs font-bold tracking-widest uppercase">to</span>
          <PriceInput
            label="Max"
            value={filters.maxPrice ?? ''}
            onChange={(val) => setFilter('maxPrice', val || undefined)}
            min={filters.minPrice ?? priceRange.min}
            max={priceRange.max}
            placeholder={String(priceRange.max)}
          />
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
          <span className="text-sm font-bold text-white group-hover:text-white transition-colors">
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
            <aside className="relative ml-auto w-80 max-w-[90vw] h-full bg-black border-l border-white/10 overflow-y-auto animate-slide-in-right">
              <div className="sticky top-0 bg-black border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <h2 className="font-bold text-white uppercase tracking-wider">Filters</h2>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
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
        <div className="sticky top-24 bg-black rounded-2xl border border-white/10 px-5 py-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-5">Filters</h2>
          <FilterContent />
        </div>
      </aside>
    </>
  );
}

function PriceInput({
  label, value, onChange, min, max, placeholder,
}: {
  label:       string;
  value:       number | '';
  onChange:    (val: string) => void;
  min:         number;
  max:         number;
  placeholder: string;
}) {
  return (
    <label className="flex-1 relative group">
      <span className="absolute -top-2 left-3 px-1 text-[9px] font-bold uppercase tracking-widest text-white/50 bg-black z-10">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-white/15 bg-white/[0.04] focus-within:border-accent focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_3px_rgba(0,122,255,0.18)] transition-colors">
        <span className="pl-3 text-white/40 text-sm font-bold select-none">$</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-2.5 text-white font-bold text-sm outline-none placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </label>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-white/10 pb-5">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-white transition-colors">
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && children}
    </div>
  );
}
