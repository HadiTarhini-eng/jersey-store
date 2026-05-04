import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCart } from '../../features/cart/hooks/useCart';
import type { NavLink as NavLinkType } from '../../types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLinkType[];
  siteName: string;
}

export function MobileNav({ isOpen, onClose, links, siteName }: MobileNavProps) {
  const { isAuthenticated, user, logout } = useAuth();
  useCart(); // ensures cart rehydration side-effects run even if totalItems is unused here
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
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={[
          'fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-surface border-r border-stroke z-50 lg:hidden',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0 animate-slide-in-left' : '-translate-x-full',
        ].join(' ')}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stroke">
          <Link to="/" className="text-lg font-black tracking-widest text-primary">
            {siteName}
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-raised transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
          {links.map((link) => (
            <div key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  [
                    'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-secondary hover:text-primary hover:bg-surface-raised',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>

              {/* Sub-links */}
              {link.children && (
                <div className="ml-4 mt-1 space-y-1 border-l border-stroke pl-3">
                  {link.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      className={({ isActive }) =>
                        [
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive ? 'text-accent' : 'text-muted hover:text-primary',
                        ].join(' ')
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-stroke p-4 space-y-2">
          {isAuthenticated ? (
            <>
              <p className="text-xs text-muted px-2 pb-1">
                {user?.firstName} {user?.lastName}
              </p>
              <Link
                to="/profile"
                className="block px-4 py-2.5 rounded-xl text-sm text-secondary hover:text-primary hover:bg-surface-raised transition-colors"
              >
                My Profile
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm border border-stroke text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm bg-accent text-accent-dark font-semibold hover:bg-accent-light transition-colors"
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
