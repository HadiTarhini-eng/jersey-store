import { useRef } from 'react';

interface UseSwipeOptions {
  /** Horizontal swipe left (drag toward the start) — typically "next". */
  onSwipeLeft: () => void;
  /** Horizontal swipe right (drag toward the end) — typically "previous". */
  onSwipeRight: () => void;
  /** Minimum horizontal distance (px) to count as a swipe. */
  threshold?: number;
}

/**
 * Lightweight horizontal-swipe detector for crossfade carousels (hero, offer
 * banners). Pointer-based so it covers both touch and mouse drag. It does NOT
 * touch auto-advance — callers keep their own interval running; this just adds
 * manual navigation on top.
 *
 * `onClickCapture` swallows the click that follows a real swipe so a drag
 * across a full-bleed banner link doesn't also navigate.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 45 }: UseSwipeOptions) {
  const start  = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    // Only a clearly-horizontal drag counts — vertical gestures stay page scroll.
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      if (dx < 0) onSwipeLeft();
      else        onSwipeRight();
    }
  };

  const onPointerCancel = () => { start.current = null; };

  // Runs before the link's own click handler — cancels navigation if the
  // pointer-up just registered a swipe.
  const onClickCapture = (e: React.MouseEvent) => {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
      swiped.current = false;
    }
  };

  return { onPointerDown, onPointerUp, onPointerCancel, onClickCapture };
}
