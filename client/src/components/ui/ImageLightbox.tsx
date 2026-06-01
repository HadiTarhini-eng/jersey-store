import { useEffect, useRef } from 'react';

export interface LightboxImage {
  src:   string;
  /** Original (full-res) URL — preferred for the zoom view; falls back to `src`. */
  full?: string;
  alt?:  string;
}

interface ImageLightboxProps {
  images:    LightboxImage[];
  index:     number;
  onClose:   () => void;
  onChange:  (next: number) => void;
}

/**
 * Full-viewport image viewer. ESC closes; ← → cycle through images; click on
 * the dimmed backdrop closes. Focus is moved to the close button on open so
 * keyboard users land on a sensible target. The page underneath stays scroll-
 * locked while open.
 */
export function ImageLightbox({ images, index, onClose, onChange }: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const active   = images[index];

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowRight') onChange(Math.min(images.length - 1, index + 1));
      else if (e.key === 'ArrowLeft')  onChange(Math.max(0, index - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, images.length, onChange, onClose]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-surface/80 hover:bg-surface text-primary flex items-center justify-center transition-colors focus-accent"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={() => onChange(index - 1)}
          aria-label="Previous image"
          className="absolute left-4 w-11 h-11 rounded-full bg-surface/80 hover:bg-surface text-primary flex items-center justify-center transition-colors focus-accent"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {index < images.length - 1 && (
        <button
          type="button"
          onClick={() => onChange(index + 1)}
          aria-label="Next image"
          className="absolute right-4 w-11 h-11 rounded-full bg-surface/80 hover:bg-surface text-primary flex items-center justify-center transition-colors focus-accent"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <img
        src={active.full ?? active.src}
        alt={active.alt ?? `Image ${index + 1} of ${images.length}`}
        className="max-w-[92vw] max-h-[88vh] object-contain"
        onError={(e) => {
          // Fall back to the compressed src if the original fails to load.
          const img = e.target as HTMLImageElement;
          if (img.src !== active.src) img.src = active.src;
        }}
      />

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted bg-surface/80 px-3 py-1 rounded-full">
        {index + 1} / {images.length}
      </span>
    </div>
  );
}
