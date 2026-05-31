import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { useFooterColumns } from '../../hooks/useFooterColumns';
import { getVisibleSocials } from './socialPlatforms';

export function Footer() {
  const siteConfig = useSiteConfig();
  const { columns } = useFooterColumns();
  const socials = getVisibleSocials(siteConfig);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-stroke mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* ── Top section: Brand + Newsletter ── */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 pb-10 border-b border-stroke">

          {/* Brand */}
          <div className="lg:max-w-xs shrink-0">
            <Link to="/" className="inline-block" aria-label="Jerseys_4Ever — Home">
              <span className="font-sport text-2xl tracking-wide text-primary hover:text-accent transition-colors">
                JERSEYS_<span className="text-accent">4</span>EVER
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              {siteConfig.tagline}
            </p>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              {siteConfig.description}
            </p>

            {/* Social icons — order/visibility driven by site config */}
            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                {socials.map((s) => (
                  <SocialLink key={s.key} href={s.href} label={s.label}>
                    {s.icon}
                  </SocialLink>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Link columns grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link, i) => (
                  <li key={`${col.title}-${link.href}-${i}`}>
                    <Link
                      to={link.href}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-stroke mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted">
            &copy; {year} Tarcoms. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Made with passion for sport.
          </p>
        </div>

      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="p-2 rounded-lg bg-surface-raised text-muted hover:text-primary hover:bg-stroke/30 transition-colors"
    >
      {children}
    </a>
  );
}
