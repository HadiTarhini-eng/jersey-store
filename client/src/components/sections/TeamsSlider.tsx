import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import { useAdminCollection } from '../../admin/hooks/useAdminCollection';
import type { Team } from '../../types';
import teamsData from '../../data/teams.json';

const teamsSeed = teamsData as Team[];

/**
 * Commercial-style sliding marquee of team crests. No names, no labels —
 * the badges speak for themselves. Hover pauses the scroll (via the
 * `.marquee-track:hover` rule in index.css) so users can click a crest.
 */
export function TeamsSlider() {
  const { items: teams } = useAdminCollection<Team>('teams', teamsSeed);
  // Duplicate the array so the marquee can loop seamlessly without a snap.
  const looped = [...teams, ...teams];
  const scrollDuration = Math.max(20, teams.length * 3);

  return (
    <section className="py-6 md:py-8 w-full">
      <div className="mb-5">
        <h2 className={theme.sectionTitle}>Your Clubs</h2>
        <p className={theme.sectionSubtitle}>Every crest tells its own story</p>
      </div>

      {/* Marquee track — edges fade out so badges enter/exit gracefully */}
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
          className="marquee-track items-center gap-6 md:gap-10 py-2 will-change-transform"
          style={{ animationDuration: `${scrollDuration}s`, animationPlayState: 'running' }}
        >
          {looped.map((team, idx) => (
            <TeamBadge key={`${team.id}-${idx}`} team={team} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamBadge({ team }: { team: Team }) {
  const sources = useMemo(() => getBadgeSources(team.logo), [team.logo]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const hasImage = sourceIndex < sources.length;

  const handleImageError = () => {
    setSourceIndex((current) => current + 1);
  };

  return (
    <Link
      to={`/shop?team=${team.slug}`}
      aria-label={team.name}
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
            className="w-11 h-11 md:w-14 md:h-14 object-contain drop-shadow"
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
  const match = url.match(
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/([^/]+)\/thumb\/(.+?)\/\d+px-[^/]+$/,
  );

  if (!match) return null;

  const [, bucket, assetPath] = match;
  return `https://upload.wikimedia.org/wikipedia/${bucket}/${assetPath}`;
}
