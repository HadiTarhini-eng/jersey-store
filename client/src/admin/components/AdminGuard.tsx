import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { ReactNode } from 'react';

/**
 * Gates the entire /admin/* tree. Non-admins land on /login with the
 * intended path stored in router state for post-login redirect.
 *
 * While `fetchCurrentUser` is in flight on first load the user is null
 * but isAuthenticated is true (token present). Don't redirect during that
 * window — wait for the hydration to land so we don't bounce a real admin.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (isAuthenticated && !user && loading) return null;

  if (!isAuthenticated || user?.role !== 'Admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
