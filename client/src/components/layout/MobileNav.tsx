import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCart } from '../../features/cart/hooks/useCart';
import { isNavLinkActive } from '../../utils/navActive';
import type { NavLink as NavLinkType } from '../../types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLinkType[];
  siteName: string;
}

export function MobileNav({ isOpen, onClose, links, siteName: _siteName }: MobileNavProps) {
  const { isAuthenticated, user, logout } = useAuth();
  useCart();
  const location = useLocation();

  // Close on route change
  useEffect(() => { onClose(); }, [location.pathname]);

  // Lock scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop — solid black so the side panel reads as one continuous slab */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer — true black, premium Nike-ish feel */}
      <aside
        className={[
          'fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-black border-r border-white/10 z-50 lg:hidden',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0 animate-slide-in-left' : '-translate-x-full',
        ].join(' ')}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link to="/" className="font-sport text-xl tracking-wide text-white">
            JERSEYS_<span className="text-accent">4</span>EVER
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {links.map((link) => (
            <div key={link.href}>
              <Link
                to={link.href}
                className={[
                  'flex items-center px-4 py-3.5 rounded-xl text-base font-bold uppercase tracking-wide transition-colors',
                  isNavLinkActive(link.href, location)
                    ? 'text-accent bg-white/5'
                    : 'text-white hover:bg-white/10',
                ].join(' ')}
              >
                {link.label}
              </Link>

              {/* Sub-links */}
              {link.children && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/15 pl-3">
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className={[
                        'block px-3 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors',
                        isNavLinkActive(child.href, location)
                          ? 'text-accent'
                          : 'text-white/70 hover:text-white',
                      ].join(' ')}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-white/10 p-5 space-y-2">
          {isAuthenticated ? (
            <>
              <p className="text-xs text-white/50 uppercase tracking-wider px-2 pb-2">
                {user?.firstName} {user?.lastName}
              </p>
              <Link
                to="/orders"
                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-white hover:bg-white/10 transition-colors"
              >
                My Orders
              </Link>
              <Link
                to="/favorites"
                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-white hover:bg-white/10 transition-colors"
              >
                Favorites
              </Link>
              <Link
                to="/profile"
                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-white hover:bg-white/10 transition-colors"
              >
                My Profile
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-danger hover:bg-danger/10 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider border border-white/30 text-white hover:bg-white hover:text-black transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-colors"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
