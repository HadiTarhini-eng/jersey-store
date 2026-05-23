import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import type { Team } from '../../types';

/**
 * Sliding strip of team crests. Auto-scrolls indefinitely (rAF-driven so it
 * cooperates with native horizontal scroll), yet the user can also drag /
 * swipe to scrub through teams. Auto-scroll briefly pauses while the user
 * interacts, then resumes from wherever they left off.
 */
export function TeamsSlider() {
  const { items: teams } = useUiContentSlot<Omit<Team, 'id'>>('team', { activeOnly: true });
  // Triple the array so wherever scrollLeft sits, badges still flow on both sides.
  const looped = useMemo(() => [...teams, ...teams, ...teams], [teams]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  /** Auto-scroll runs unless the user is actively interacting. */
  const userInteractingRef = useRef(false);
  const resumeTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || teams.length === 0) return;

    let rafId  = 0;
    let lastTs = performance.now();
    const PX_PER_SEC = 35;

    // Park scroll in the middle copy so we have room to wrap forwards and backwards.
    const setSegment = () => {
      const segment = el.scrollWidth / 3;
      if (segment > 0 && el.scrollLeft < segment * 0.5) {
        el.scrollLeft = segment;
      }
    };
    setSegment();

    const tick = (ts: number) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!userInteractingRef.current) {
        el.scrollLeft += PX_PER_SEC * dt;
      }
      // Wrap when we drift past the second copy.
      const segment = el.scrollWidth / 3;
      if (segment > 0) {
        if (el.scrollLeft >= segment * 2) el.scrollLeft -= segment;
        else if (el.scrollLeft <= segment * 0.5) el.scrollLeft += segment;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [teams.length]);

  const pauseAndResume = () => {
    userInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userInteractingRef.current = false;
    }, 800);
  };

  // Pointer drag-to-scrub
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);
    userInteractingRef.current = true;
    dragStartRef.current = { x: e.clientX, scrollLeft: el.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !dragStartRef.current) return;
    el.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragStartRef.current = null;
    pauseAndResume();
  };

  return (
    <section className="py-6 md:py-8 w-full">
      <div className="mb-5">
        <h2 className={theme.sectionTitle}>Your Clubs</h2>
        <p className={theme.sectionSubtitle}>Every crest tells its own story</p>
      </div>

      <div
        className="w-full overflow-hidden relative"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        }}
      >
        <div
          ref={trackRef}
          onWheel={pauseAndResume}
          onTouchStart={pauseAndResume}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={[
            'flex items-center gap-6 md:gap-10 py-2 overflow-x-auto hide-scrollbar',
            'will-change-scroll',
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
          ].join(' ')}
          style={{ scrollSnapType: 'none' }}
        >
          {looped.map((team, idx) => (
            <TeamBadge key={`${team.id}-${idx}`} team={team} draggable={isDragging} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamBadge({ team, draggable }: { team: Team; draggable: boolean }) {
  const sources = useMemo(() => getBadgeSources(team.logo), [team.logo]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const hasImage = sourceIndex < sources.length;

  const handleImageError = () => setSourceIndex((c) => c + 1);

  // While dragging, swallow the click so the user doesn't get yanked to a team page.
  const onClick = (e: React.MouseEvent) => { if (draggable) e.preventDefault(); };

  return (
    <Link
      to={`/shop?team=${team.slug}`}
      aria-label={team.name}
      onClick={onClick}
      onDragStart={(e) => e.preventDefault()}
      className="shrink-0 group"
    >
      <div
        className="
          relative w-16 h-16 md:w-20 md:h-20 rounded-full
          flex items-center justify-center bg-white/95 ring-1 ring-white/70 overflow-hidden
          transition-all duration-300
          group-hover:scale-110 group-hover:bg-white
          group-hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]
        "
      >
        {hasImage ? (
          <img
            src={sources[sourceIndex]}
            alt={team.name}
            loading="lazy"
            draggable={false}
            referrerPolicy="no-referrer"
            className="w-11 h-11 md:w-14 md:h-14 object-contain drop-shadow pointer-events-none"
            onError={handleImageError}
          />
        ) : (
          <span
            className="font-sport text-base md:text-lg tracking-wide font-bold"
            style={{ color: team.color ?? '#000000' }}
          >
            {team.abbreviation ?? team.name.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
}

function getBadgeSources(logo: string) {
  const sources = [logo];
  const original = toOriginalWikimediaAsset(logo);
  if (original && original !== logo) sources.push(original);
  return sources;
}

function toOriginalWikimediaAsset(url: string) {
  if (url == null || url === undefined) return null;

  const match = url.match(
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/([^/]+)\/thumb\/(.+?)\/\d+px-[^/]+$/,
  );
  if (!match) return null;

  const [, bucket, assetPath] = match;
  return `https://upload.wikimedia.org/wikipedia/${bucket}/${assetPath}`;
}
