import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../config/theme';
import type { Team } from '../../types';
import teamsData from '../../data/teams.json';

const teams = teamsData as Team[];

export function TeamsSlider() {
  return (
    <section className="py-12 md:py-16 w-full">
      {/* Section header */}
      <div className="mb-8">
        <h2 className={theme.sectionTitle}>Shop by Team</h2>
        <p className={theme.sectionSubtitle}>All your favourite clubs in one place</p>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-2">
        {teams.map((team) => (
          <TeamCircle key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}

interface TeamCircleProps {
  team: Team;
}

function TeamCircle({ team }: TeamCircleProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      to={`/shop?team=${team.slug}`}
      className="flex flex-col items-center gap-2 shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Circle */}
      <div
        className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          backgroundColor: team.color ?? '#1a1b1f',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          boxShadow: hovered
            ? `0 0 20px ${team.color ?? '#007aff'}66, 0 0 40px ${team.color ?? '#007aff'}22`
            : 'none',
        }}
      >
        <span
          className="font-sport text-base md:text-lg tracking-wide font-bold uppercase"
          style={{ color: '#ffffff' }}
        >
          {team.abbreviation ?? team.name.slice(0, 3).toUpperCase()}
        </span>
      </div>

      {/* Team name */}
      <span
        className="text-xs text-center text-secondary transition-colors duration-200 leading-tight"
        style={{
          maxWidth: '90px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          color: hovered ? '#f5f5f7' : undefined,
        }}
      >
        {team.name}
      </span>
    </Link>
  );
}
