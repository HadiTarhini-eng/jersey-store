import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-secondary mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          className={[
            'w-full bg-surface border rounded-lg text-primary text-sm',
            'placeholder:text-muted transition-colors duration-150 outline-none',
            'py-3',
            leftIcon  ? 'pl-10 pr-4' : 'px-4',
            rightIcon ? 'pr-10' : '',
            error
              ? 'border-danger focus:border-danger'
              : 'border-stroke hover:border-accent/50 focus:border-accent',
            'focus-visible:ring-2 focus-visible:ring-accent/30',
            className,
          ].join(' ')}
          {...rest}
        />

        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
            {rightIcon}
          </span>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
