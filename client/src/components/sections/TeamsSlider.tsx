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

  const trackRef = useRef<HTMLDivElement | null>(null);
  /** Auto-scroll runs unless the user is actively interacting. */
  const userInteractingRef = useRef(false);
  const resumeTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * `needsLoop` becomes true only when the single-copy width is wider than
   * the viewport — i.e. there's something to actually scroll. Otherwise we
   * render the teams just once and skip the marquee duplication entirely so
   * the user doesn't see ghost copies of each crest.
   */
  const [needsLoop, setNeedsLoop] = useState(false);

  // Measure: does one copy of the badges overflow its container?
  useEffect(() => {
    const el = trackRef.current;
    if (!el || teams.length === 0) { setNeedsLoop(false); return; }

    const measure = () => {
      // When we duplicated the list, scrollWidth covers both halves. Detect
      // overflow against half of scrollWidth (or full width if we haven't
      // duplicated yet).
      const singleWidth = needsLoop ? el.scrollWidth / 2 : el.scrollWidth;
      setNeedsLoop(singleWidth > el.clientWidth + 1);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [teams.length, needsLoop]);

  // Auto-scroll loop — only runs when duplication is in effect.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !needsLoop) return;

    let rafId  = 0;
    let lastTs = performance.now();
    const PX_PER_SEC = 35;

    const tick = (ts: number) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!userInteractingRef.current) {
        el.scrollLeft += PX_PER_SEC * dt;
      }
      // Wrap at half-width — the classic seamless marquee trick.
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft < 0) el.scrollLeft += half;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [needsLoop]);

  const displayTeams = useMemo(
    () => (needsLoop ? [...teams, ...teams] : teams),
    [teams, needsLoop],
  );

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
          {displayTeams.map((team, idx) => (
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
          relative w-16 h-16 md:w-20 md:h-20
          flex items-center justify-center
          transition-transform duration-300 group-hover:scale-110
        "
      >
        {hasImage ? (
          // Crest renders as-is — upload a transparent (no-background) PNG and
          // it fills the badge box at full size, with a soft shadow for depth
          // against the dark section.
          <img
            src={sources[sourceIndex]}
            alt={team.name}
            loading="lazy"
            draggable={false}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none"
            onError={handleImageError}
          />
        ) : (
          <span
            className="font-sport text-lg md:text-xl tracking-wide font-bold text-primary"
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
