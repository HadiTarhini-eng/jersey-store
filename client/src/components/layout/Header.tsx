import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../features/cart/hooks/useCart';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { useNavLinks } from '../../hooks/useNavLinks';
import { isNavLinkActive } from '../../utils/navActive';
import { MobileNav } from './MobileNav';
import { SearchButton } from './SearchButton';

/** Reusable cart button — same markup on mobile and desktop, different placement. */
function CartButton({ totalItems, openCart }: { totalItems: number; openCart: () => void }) {
  return (
    <button
      onClick={openCart}
      aria-label={`Cart (${totalItems} items)`}
      className="relative rounded-xl px-3 py-2 flex items-center gap-2 text-white border-2 border-white hover:bg-white hover:text-black transition-all"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="3" y1="6" x2="21" y2="6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
      </svg>
      {totalItems > 0 && (
        <span className="bg-power text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold leading-none">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}

/** Reusable logo wordmark. */
function Logo() {
  return (
    <Link
      to="/"
      className="font-sport text-xl tracking-wide text-white whitespace-nowrap"
      aria-label="Jerseys_4Ever — Home"
    >
      JERSEYS_<span className="text-accent">4</span>EVER
    </Link>
  );
}

export function Header() {
  const siteConfig = useSiteConfig();
  const { links: navLinks } = useNavLinks();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown]       = useState<string | null>(null);
  const [accountOpen, setAccountOpen]         = useState(false);
  const [isScrolled, setIsScrolled]           = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef  = useRef<HTMLDivElement>(null);
  const location    = useLocation();

  const { totalItems, open: openCart } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close all dropdowns on route change.
  useEffect(() => { setOpenDropdown(null); setAccountOpen(false); }, [location]);

  // Outside-click closes the nav-link dropdown.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
      if (accountRef.current  && !accountRef.current.contains(e.target as Node))  setAccountOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header
        className={[
          'sticky top-0 z-40 w-full transition-all duration-300 bg-black text-white',
          isScrolled ? 'border-b border-white/15 shadow-lg shadow-black/40' : 'border-b border-white/10',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Mobile layout: burger ◀  logo ●  cart ▶ ───────────────────────── */}
          <div className="lg:hidden grid grid-cols-[1fr_auto_1fr] items-center h-16 gap-3">
            <div className="justify-self-start">
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="justify-self-center">
              <Logo />
            </div>

            <div className="justify-self-end flex items-center gap-2">
              <SearchButton />
              <CartButton totalItems={totalItems} openCart={openCart} />
            </div>
          </div>

          {/* ── Desktop layout — logo left, centered nav, actions right ───────── */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <Logo />

            <nav
              ref={dropdownRef}
              className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
              aria-label="Primary"
            >
              {navLinks.map((link) => (
                <div key={link.href} className="relative">
                  {link.children ? (
                    <>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === link.href ? null : link.href)}
                        className={[
                          'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors',
                          openDropdown === link.href
                            ? 'text-accent bg-white/5'
                            : 'text-white hover:bg-white/10',
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
                        <div className="absolute top-full left-0 mt-1 w-52 bg-black border border-white/15 rounded-xl shadow-2xl shadow-black/60 animate-slide-up overflow-hidden">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={[
                                'block px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors',
                                isNavLinkActive(child.href, location)
                                  ? 'text-accent bg-white/5'
                                  : 'text-white/80 hover:text-white hover:bg-white/10',
                              ].join(' ')}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={link.href}
                      className={[
                        'px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors',
                        isNavLinkActive(link.href, location)
                          ? 'text-accent bg-white/5'
                          : 'text-white hover:bg-white/10',
                      ].join(' ')}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Right cluster — kept narrow so the centered nav never overlaps. */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    aria-label={`Account — ${user?.firstName ?? 'user'}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                      {user?.firstName?.[0] ?? '?'}
                    </div>
                    <svg className={`w-3.5 h-3.5 transition-transform ${accountOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 w-56 bg-black border border-white/15 rounded-xl shadow-2xl shadow-black/60 animate-slide-up overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/50 truncate">{user?.email}</p>
                      </div>
                      <NavLink to="/orders"    role="menuitem" className={({ isActive }) => `block px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-accent bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>My Orders</NavLink>
                      <NavLink to="/favorites" role="menuitem" className={({ isActive }) => `block px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-accent bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>Favorites</NavLink>
                      <NavLink to="/profile"   role="menuitem" className={({ isActive }) => `block px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-accent bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>Profile</NavLink>
                      <button
                        type="button"
                        onClick={() => { setAccountOpen(false); logout(); }}
                        role="menuitem"
                        className="w-full text-left block px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-danger hover:bg-danger/10 transition-colors border-t border-white/10"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              <SearchButton />
              <CartButton totalItems={totalItems} openCart={openCart} />
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
