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
    setToasts((prev) => [...prev, { ...toast, id }]);
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
// Viewport — stack in the top-right corner.
// ─────────────────────────────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, { ring: string; icon: ReactNode; iconBg: string }> = {
  success: {
    ring:   'border-delivered/40',
    iconBg: 'bg-delivered/15 text-delivered',
    icon:   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  },
  error: {
    ring:   'border-danger/40',
    iconBg: 'bg-danger/15 text-danger',
    icon:   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  },
  warning: {
    ring:   'border-caution/40',
    iconBg: 'bg-caution/15 text-caution',
    icon:   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
  },
  info: {
    ring:   'border-accent/40',
    iconBg: 'bg-accent/15 text-accent',
    icon:   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
};

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
      {toasts.map((toast) => {
        const styles = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={[
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl',
              'bg-surface text-primary border shadow-2xl shadow-black/40 animate-scale-in',
              styles.ring,
            ].join(' ')}
          >
            <span className={['shrink-0 w-7 h-7 rounded-full flex items-center justify-center', styles.iconBg].join(' ')}>
              {styles.icon}
            </span>
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-sm font-bold text-primary leading-tight mb-0.5">{toast.title}</p>}
              <p className="text-sm text-secondary leading-snug">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 p-1 rounded-md text-muted hover:text-primary hover:bg-white/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
