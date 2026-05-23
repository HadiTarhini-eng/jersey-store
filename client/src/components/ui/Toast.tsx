import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id:        string;
  variant:   ToastVariant;
  title?:    string;
  message:   string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts:  Toast[];
  push:    (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  /** Wrap an async op: shows success/error toasts automatically. Returns the promise. */
  promise: <T>(op: Promise<T>, opts: { loading?: string; success: string; error: string | ((err: unknown) => string) }) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const t = timeouts.current.get(id);
    if (t) {
      clearTimeout(t);
      timeouts.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = toast.durationMs ?? DEFAULT_DURATION;
    setToasts((prev) => [...prev, { ...toast, id, durationMs: duration }]);
    if (duration > 0) {
      timeouts.current.set(id, setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [dismiss]);

  const promise = useCallback(<T,>(
    op: Promise<T>,
    opts: { loading?: string; success: string; error: string | ((err: unknown) => string) },
  ): Promise<T> => {
    const loadingId = opts.loading
      ? push({ variant: 'info', message: opts.loading, durationMs: 0 })
      : null;

    return op
      .then((value) => {
        if (loadingId) dismiss(loadingId);
        push({ variant: 'success', message: opts.success });
        return value;
      })
      .catch((err) => {
        if (loadingId) dismiss(loadingId);
        const message = typeof opts.error === 'function' ? opts.error(err) : opts.error;
        push({ variant: 'error', message });
        throw err;
      });
  }, [push, dismiss]);

  useEffect(() => () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current.clear();
  }, []);

  const value = useMemo(() => ({ toasts, push, dismiss, promise }), [toasts, push, dismiss, promise]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-variant styling — each variant has a base color that drives the icon
// circle, left accent stripe, glow shadow, and the time-to-dismiss progress bar.
// The card itself stays dark so the colored elements always pop.
// ─────────────────────────────────────────────────────────────────────────────

interface VariantStyle {
  /** Tailwind class string for the icon circle background. */
  iconBg:   string;
  /** Glow shadow utility — colored shadow that hugs the toast. */
  glow:     string;
  /** Left accent stripe color. */
  stripe:   string;
  /** Bottom progress bar color. */
  progress: string;
  icon:     ReactNode;
}

const variantStyles: Record<ToastVariant, VariantStyle> = {
  success: {
    iconBg:   'bg-ok text-white',
    glow:     'shadow-2xl shadow-ok/30',
    stripe:   'bg-ok',
    progress: 'bg-ok',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  },
  error: {
    iconBg:   'bg-danger text-white',
    glow:     'shadow-2xl shadow-danger/30',
    stripe:   'bg-danger',
    progress: 'bg-danger',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  },
  warning: {
    iconBg:   'bg-caution text-black',
    glow:     'shadow-2xl shadow-caution/30',
    stripe:   'bg-caution',
    progress: 'bg-caution',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
  },
  info: {
    iconBg:   'bg-accent text-white',
    glow:     'shadow-2xl shadow-accent/30',
    stripe:   'bg-accent',
    progress: 'bg-accent',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Viewport — anchored top-right, max z-index so nothing in the app can occlude.
// ─────────────────────────────────────────────────────────────────────────────

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const styles = variantStyles[toast.variant];
  const duration = toast.durationMs ?? DEFAULT_DURATION;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={[
        'pointer-events-auto relative overflow-hidden',
        'flex items-start gap-3 p-4 pl-5 rounded-2xl',
        // Dark gradient base — premium feel, lets the colored elements pop
        'bg-gradient-to-br from-zinc-900 via-black to-zinc-950',
        'border border-white/10',
        'animate-toast-in',
        styles.glow,
      ].join(' ')}
    >
      {/* Left accent stripe — variant color; rounded on the same radius as the container. */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${styles.stripe}`} aria-hidden="true" />

      {/* Icon — circle with colored fill */}
      <span className={['shrink-0 w-9 h-9 rounded-full flex items-center justify-center', styles.iconBg].join(' ')}>
        {styles.icon}
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <p className="text-sm font-bold text-white leading-tight tracking-wide mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-white/85 leading-snug">{toast.message}</p>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Time-to-dismiss progress bar — colored, shrinks from full width to 0 */}
      {duration > 0 && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-0.5 ${styles.progress} origin-left`}
          style={{ width: '100%', animation: `toastProgress ${duration}ms linear forwards` }}
        />
      )}
    </div>
  );
}
