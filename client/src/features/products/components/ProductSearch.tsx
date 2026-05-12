import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useFilters } from '../hooks/useFilters';

interface ProductSearchProps {
  placeholder?: string;
}

export function ProductSearch({ placeholder = 'Search jerseys, teams, sports…' }: ProductSearchProps) {
  const { filters, setQuery } = useFilters();

  // Local state tracks the input; URL query updates after debounce
  const [localValue, setLocalValue] = useState(filters.query ?? '');
  const debouncedValue = useDebounce(localValue, 350);

  // Sync debounced value → URL filter params
  useEffect(() => {
    if (debouncedValue !== (filters.query ?? '')) {
      setQuery(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  const clear = () => {
    setLocalValue('');
    setQuery('');
  };

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>

      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full pl-11 pr-10 py-3 rounded-xl',
          'bg-surface border border-stroke',
          'text-primary text-sm placeholder:text-muted',
          'hover:border-accent/50 focus:border-accent',
          'outline-none transition-colors duration-150',
          'focus-visible:ring-2 focus-visible:ring-accent/30',
        ].join(' ')}
      />

      {localValue && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
