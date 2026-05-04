import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ label, options, error, className = '', id, ...rest }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-secondary mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={[
            'w-full appearance-none bg-surface border rounded-lg',
            'px-4 py-3 pr-10 text-sm text-primary',
            'outline-none transition-colors duration-150',
            error
              ? 'border-danger focus:border-danger'
              : 'border-stroke hover:border-accent/50 focus:border-accent',
            'focus-visible:ring-2 focus-visible:ring-accent/30',
            className,
          ].join(' ')}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
