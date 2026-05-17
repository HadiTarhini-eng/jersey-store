import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../features/cart/hooks/useCart';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { MobileNav } from './MobileNav';
import type { NavLink as NavLinkType, SiteConfig } from '../../types';

interface HeaderProps {
  siteConfig: SiteConfig;
  navLinks: NavLinkType[];
}

export function Header({ siteConfig, navLinks }: HeaderProps) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown]       = useState<string | null>(null);
  const [isScrolled, setIsScrolled]           = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location    = useLocation();

  const { totalItems, open: openCart } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  // Deepen glass effect on scroll
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setOpenDropdown(null); }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header
        className={[
          'sticky top-0 z-40 w-full transition-all duration-300',
          isScrolled
            ? 'bg-background/98 backdrop-blur-md border-b border-stroke shadow-card'
            : 'bg-background/95 backdrop-blur-md border-b border-stroke',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="Jerseys4Ever — Home"
            >
              <span className="font-sport text-xl tracking-wide text-primary">
                JERSEYS<span className="text-accent">4</span>EVER
              </span>
            </Link>

            {/* ── Desktop nav (center) ── */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <div key={link.href} className="relative">
                  {link.children ? (
                    <>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === link.href ? null : link.href)}
                        className={[
                          'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          openDropdown === link.href ? 'text-accent' : 'text-secondary hover:text-primary',
                        ].join(' ')}
                      >
                        {link.label}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${openDropdown === link.href ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openDropdown === link.href && (
                        <div className="absolute top-full left-0 mt-1 w-52 bg-surface-raised border border-stroke rounded-xl shadow-card-hover animate-slide-up overflow-hidden">
                          {link.children.map((child) => (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              className={({ isActive }) =>
                                [
                                  'block px-4 py-2.5 text-sm transition-colors',
                                  isActive
                                    ? 'text-accent bg-accent/5'
                                    : 'text-secondary hover:text-primary hover:bg-surface',
                                ].join(' ')
                              }
                            >
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={link.href}
                      className={({ isActive }) =>
                        [
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive ? 'text-accent' : 'text-secondary hover:text-primary',
                        ].join(' ')
                      }
                    >
                      {link.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2">

              {/* Auth — desktop only */}
              {isAuthenticated ? (
                <div className="hidden lg:flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                      {user?.firstName?.[0]}
                    </div>
                    <span>{user?.firstName}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden xl:block px-3 py-2 rounded-lg text-sm text-muted hover:text-primary transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent-light transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Cart button */}
              <button
                onClick={openCart}
                aria-label={`Cart (${totalItems} items)`}
                className="bg-surface rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-surface-raised border border-stroke hover:border-accent/30 transition-all"
              >
                {/* Shopping bag SVG */}
                <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line strokeLinecap="round" strokeLinejoin="round" x1="3" y1="6" x2="21" y2="6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
                </svg>
                {totalItems > 0 && (
                  <span className="bg-power text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navLinks}
        siteName={siteConfig.name}
      />
    </>
  );
}
