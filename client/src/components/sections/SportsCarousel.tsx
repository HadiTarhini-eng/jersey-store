import { Link } from 'react-router-dom';
import { useAdminCollection } from '../../admin/hooks/useAdminCollection';
import type { Sport } from '../../types';
import sportsData from '../../data/sports.json';

const sportsSeed = sportsData as Sport[];

export function SportsCarousel() {
  const { items: sports } = useAdminCollection<Sport>('sports', sportsSeed);

  return (
    <div className="w-full">
      <div className="flex gap-5 md:gap-8 overflow-x-auto hide-scrollbar pb-2 md:justify-center md:flex-wrap md:overflow-visible">
        {sports.map((sport) => (
          <SportCircle key={sport.id} sport={sport} />
        ))}
      </div>
    </div>
  );
}

function SportCircle({ sport }: { sport: Sport }) {
  const ring = sport.color ?? 'rgb(var(--accent))';

  return (
    <Link
      to={`/shop?sport=${sport.slug}`}
      className="group flex flex-col items-center gap-3 shrink-0 focus:outline-none"
    >
      {/* Circle */}
      <div
        className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 transition-all duration-300 group-hover:scale-105"
        style={{ borderColor: 'rgb(var(--stroke))' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ring; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgb(var(--stroke))'; }}
      >
        {sport.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${sport.image})` }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: sport.color ?? 'rgb(var(--surface-raised))' }}
          />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-background/40 group-hover:bg-background/20 transition-colors duration-300" />

        {/* Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl md:text-4xl drop-shadow-lg">{sport.icon}</span>
        </div>
      </div>

      {/* Label */}
      <span className="text-xs md:text-sm font-semibold text-secondary group-hover:text-primary transition-colors uppercase tracking-wider text-center">
        {sport.name}
      </span>
    </Link>
  );
}
