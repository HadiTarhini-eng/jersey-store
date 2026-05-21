interface StarRatingProps {
  /** 0–5; non-integer values render half-stars. */
  value:   number;
  /** Optional count of reviews to display next to the stars. */
  count?:  number;
  size?:   'sm' | 'md';
  className?: string;
}

const SIZE_PX = { sm: 14, md: 16 } as const;

/**
 * Read-only star rating display. Splits each star into a half-fill mask so
 * we can render 3.5/5 without rounding noise. Output is purely visual; the
 * aria-label carries the numeric value for screen readers.
 */
export function StarRating({ value, count, size = 'sm', className }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const fillPct = (clamped / 5) * 100;
  const px = SIZE_PX[size];

  return (
    <span
      className={['inline-flex items-center gap-2', className].filter(Boolean).join(' ')}
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${typeof count === 'number' ? ` from ${count} reviews` : ''}`}
    >
      <span className="relative inline-block" style={{ width: px * 5, height: px }} aria-hidden="true">
        {/* track */}
        <span className="absolute inset-0 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`bg-${i}`} px={px} className="text-stroke" />
          ))}
        </span>
        {/* fill */}
        <span
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${fillPct}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`fg-${i}`} px={px} className="text-caution" />
          ))}
        </span>
      </span>
      {typeof count === 'number' && (
        <span className="text-sm text-muted">
          {clamped.toFixed(1)} <span className="text-stroke">·</span> {count} review{count === 1 ? '' : 's'}
        </span>
      )}
    </span>
  );
}

function Star({ px, className }: { px: number; className: string }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={['shrink-0', className].join(' ')}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
