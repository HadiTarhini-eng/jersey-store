import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { PageSpinner } from '../ui/Spinner';
import { ROUTES } from '../../config/routes';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If true, redirects authenticated users away (e.g. login/register pages). */
  redirectIfAuthenticated?: boolean;
}

/**
 * Wraps routes that require (or forbid) authentication.
 * Stores the attempted URL so we can redirect back after login.
 *
 * Three states are enforced, with the Supabase session as the source of truth
 * (`isAuthenticated` is only true once Supabase reports a confirmed address and
 * the backend has resolved the application profile):
 *   - no session          → /login
 *   - session, unverified → /verify-email
 *   - session, verified   → allowed through
 */
export function ProtectedRoute({ children, redirectIfAuthenticated = false }: ProtectedRouteProps) {
  const { isAuthenticated, hasSession, emailVerified, initializing } = useAppSelector((s) => s.auth);
  const location = useLocation();

  // Never decide before the session has been restored — that would bounce a
  // signed-in user to /login on every hard refresh.
  if (initializing) return <PageSpinner />;

  if (redirectIfAuthenticated) {
    return isAuthenticated ? <Navigate to={ROUTES.HOME} replace /> : <>{children}</>;
  }

  if (!isAuthenticated) {
    // A session that exists but isn't verified belongs on the verify page.
    const target = hasSession && !emailVerified ? ROUTES.VERIFY_EMAIL : ROUTES.LOGIN;
    return <Navigate to={target} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
