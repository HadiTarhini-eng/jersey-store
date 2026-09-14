import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { ReactNode } from 'react';

/**
 * Gates the entire /admin/* tree. Non-admins land on /login with the
 * intended path stored in router state for post-login redirect.
 *
 * While the Supabase session is being restored (and the profile fetched) the
 * user is still null. Don't redirect during that window — wait for it to land
 * so we don't bounce a real admin on a hard refresh.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, hasSession, initializing, loading } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (initializing || (hasSession && !user && loading)) return null;

  if (!isAuthenticated || user?.role !== 'Admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
