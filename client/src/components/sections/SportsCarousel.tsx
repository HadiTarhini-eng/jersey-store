import React from 'react';
import { Link } from 'react-router-dom';
import type { Sport } from '../../types';
import sportsData from '../../data/sports.json';

const sports = sportsData as Sport[];

export function SportsCarousel() {
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const visibleCount = 4;
  const maxIdx = Math.max(0, sports.length - visibleCount);

  const prev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const next = () => setCurrentIdx((i) => Math.min(maxIdx, i + 1));

  return (
    <div className="w-full">
      {/* Desktop: carousel with arrows */}
      <div className="hidden md:block relative">
        {/* Prev button */}
        {currentIdx > 0 && (
          <button
            onClick={prev}
            aria-label="Previous sports"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-surface-raised border border-stroke text-primary hover:border-accent hover:text-accent transition-all duration-200 flex items-center justify-center shadow-card-hover"
          >
            ‹
          </button>
        )}

        {/* Cards viewport */}
        <div className="overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${currentIdx} * (25% + 4px)))` }}
          >
            {sports.map((sport) => (
              <SportCard key={sport.id} sport={sport} />
            ))}
          </div>
        </div>

        {/* Next button */}
        {currentIdx < maxIdx && (
          <button
            onClick={next}
            aria-label="Next sports"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-surface-raised border border-stroke text-primary hover:border-accent hover:text-accent transition-all duration-200 flex items-center justify-center shadow-card-hover"
          >
            ›
          </button>
        )}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="flex md:hidden gap-4 overflow-x-auto hide-scrollbar pb-2">
        {sports.map((sport) => (
          <SportCard key={sport.id} sport={sport} mobile />
        ))}
      </div>
    </div>
  );
}

interface SportCardProps {
  sport: Sport;
  mobile?: boolean;
}

function SportCard({ sport, mobile }: SportCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      to={`/shop?sport=${sport.slug}`}
      className={[
        'relative flex-shrink-0 rounded-2xl overflow-hidden block group cursor-pointer',
        mobile ? 'w-40' : 'w-1/4 min-w-0 flex-1',
      ].join(' ')}
      style={{ aspectRatio: '3/4' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image */}
      {sport.image && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
          style={{
            backgroundImage: `url(${sport.image})`,
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(8,9,10,0.45)', opacity: hovered ? 0.35 : 0.55 }}
      />

      {/* Colored bottom border glow on hover */}
      <div
        className="absolute inset-x-0 bottom-0 h-1 transition-opacity duration-300"
        style={{ backgroundColor: sport.color ?? '#007aff', opacity: hovered ? 1 : 0 }}
      />

      {/* Sport icon — centered top area */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-4">
        <span
          className="text-5xl transition-transform duration-300"
          style={{ transform: hovered ? 'scale(1.15)' : 'scale(1)' }}
        >
          {sport.icon}
        </span>

        {/* Sport name — bottom */}
        <div className="w-full">
          <p className="font-sport text-xl md:text-2xl tracking-wide text-white uppercase text-center drop-shadow-lg">
            {sport.name}
          </p>
          <p
            className="text-center text-xs mt-1 font-medium transition-opacity duration-300"
            style={{ color: sport.color ?? '#007aff', opacity: hovered ? 1 : 0 }}
          >
            Shop →
          </p>
        </div>
      </div>
    </Link>
  );
}
