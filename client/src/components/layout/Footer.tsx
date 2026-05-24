import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { useFooterColumns } from '../../hooks/useFooterColumns';

export function Footer() {
  const siteConfig = useSiteConfig();
  const { columns } = useFooterColumns();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-stroke mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* ── Top section: Brand + Newsletter ── */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 pb-10 border-b border-stroke">

          {/* Brand */}
          <div className="lg:max-w-xs shrink-0">
            <Link to="/" className="inline-block" aria-label="Jerseys4Ever — Home">
              <span className="font-sport text-2xl tracking-wide text-primary hover:text-accent transition-colors">
                JERSEYS<span className="text-accent">4</span>EVER
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              {siteConfig.tagline}
            </p>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              {siteConfig.description}
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              {siteConfig.socialLinks.instagram && (
                <SocialLink href={siteConfig.socialLinks.instagram} label="Instagram">
                  {/* Instagram */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </SocialLink>
              )}
              {siteConfig.socialLinks.twitter && (
                <SocialLink href={siteConfig.socialLinks.twitter} label="Twitter / X">
                  {/* X / Twitter */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </SocialLink>
              )}
              {siteConfig.socialLinks.facebook && (
                <SocialLink href={siteConfig.socialLinks.facebook} label="Facebook">
                  {/* Facebook */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </SocialLink>
              )}
              {siteConfig.socialLinks.youtube && (
                <SocialLink href={siteConfig.socialLinks.youtube} label="YouTube">
                  {/* YouTube */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </SocialLink>
              )}
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="flex-1 lg:max-w-sm lg:ml-auto">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
              Stay in the game
            </h3>
            <p className="text-sm text-muted mb-4">
              Get exclusive drops, early access, and insider offers straight to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-raised border border-stroke text-primary placeholder:text-muted text-sm hover:border-accent/50 focus:border-accent outline-none transition-colors"
                aria-label="Email for newsletter"
              />
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-light transition-colors shrink-0"
              >
                Subscribe
              </button>
            </div>
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
            &copy; {year} {siteConfig.name}. All rights reserved.
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
