interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-[3px]' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full border-stroke border-t-accent animate-spin',
        sizeClasses[size],
        className,
      ].join(' ')}
    />
  );
}

/** Full-page loading overlay */
export function PageSpinner() {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <Spinner size="lg" />
    </div>
  );
}
