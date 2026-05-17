interface ComingSoonPanelProps {
  title: string;
  description: string;
  phase: number;
}

/**
 * Placeholder used by admin pages not yet implemented. Keeps the
 * navigation working while phase 2/3 pages land.
 */
export function ComingSoonPanel({ title, description, phase }: ComingSoonPanelProps) {
  return (
    <div className="bg-surface border border-stroke rounded-2xl p-8 sm:p-12 text-center">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent/10 text-accent border border-accent/30 mb-4">
        Phase {phase}
      </span>
      <h2 className="font-sport text-3xl tracking-wide text-primary uppercase mb-2">{title}</h2>
      <p className="text-secondary text-sm max-w-md mx-auto">{description}</p>
    </div>
  );
}
