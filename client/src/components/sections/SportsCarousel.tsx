import { Link } from 'react-router-dom';
import { useUiContentSlot } from '../../hooks/useUiContentSlot';
import type { Sport } from '../../types';

/**
 * Shop-by-Sport — angled "ticket" tiles instead of plain circles.
 * Each tile carries a full-bleed image, a sport-colored angular overlay, the
 * sport name in display font, and a corner icon. Horizontal-scroll on mobile,
 * grid on md+.
 */
export function SportsCarousel() {
  const { items: sports } = useUiContentSlot<Omit<Sport, 'id'>>('sport', { activeOnly: true });

  return (
    <div className="w-full">
      <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-5 overflow-x-auto hide-scrollbar pb-2 md:overflow-visible md:pb-0">
        {sports.map((sport) => (
          <SportTile key={sport.id} sport={sport} />
        ))}
      </div>
    </div>
  );
}

function SportTile({ sport }: { sport: Sport }) {
  const color = sport.color ?? '#007aff';

  return (
    <Link
      to={`/shop?sport=${sport.slug}`}
      className="group relative shrink-0 w-56 md:w-auto h-44 md:h-48 rounded-2xl overflow-hidden border border-white/10 focus-accent isolate"
      aria-label={`Shop ${sport.name}`}
    >
      {/* Image base */}
      {sport.image ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
          style={{ backgroundImage: `url(${sport.image})` }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: color }} />
      )}

      {/* Dark base wash so the text stays legible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />

      {/* Angled color slash — the signature accent of this design */}
      <div
        className="absolute -left-12 -bottom-12 w-48 h-32 opacity-80 mix-blend-screen transition-transform duration-500 group-hover:translate-x-2"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, transparent 70%)`,
          transform: 'skewY(-12deg)',
        }}
      />

      {/* Corner icon */}
      <span
        aria-hidden="true"
        className="absolute top-3 right-3 text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
      >
        {sport.icon}
      </span>

      {/* Kicker stripe */}
      <span
        aria-hidden="true"
        className="absolute left-4 bottom-[4.25rem] block h-[3px] w-8 rounded-full transition-all duration-300 group-hover:w-14"
        style={{ backgroundColor: color }}
      />

      {/* Title */}
      <div className="absolute left-4 bottom-4 right-4">
        <h3 className="font-sport text-3xl md:text-4xl text-white leading-[0.95] tracking-wide uppercase">
          {sport.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 group-hover:text-white transition-colors">
          <span>Shop now</span>
          <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
