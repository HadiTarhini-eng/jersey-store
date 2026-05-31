import type { ReactNode } from 'react';

/**
 * Shared wrapper for static content pages (FAQ, policies, about, contact…).
 * Keeps a consistent heading + reading-width column so every info page reads
 * the same and a design tweak lives in one place.
 */
export function InfoLayout({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-10">
        <h1 className="font-sport text-4xl md:text-5xl tracking-wide text-primary uppercase">{title}</h1>
        {intro && <p className="text-secondary mt-3 leading-relaxed">{intro}</p>}
      </header>
      <div className="space-y-10">{children}</div>
    </div>
  );
}

/** A titled block of body copy inside an InfoLayout. */
export function InfoSection({ heading, children }: { heading?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      {heading && <h2 className="text-lg font-bold text-primary">{heading}</h2>}
      <div className="text-secondary text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
