import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { ReactNode } from 'react';

/**
 * Gates the entire /admin/* tree. Non-admins land on /login with the
 * intended path stored in router state for post-login redirect.
 *
 * DEV BYPASS: while the backend isn't wired up there's no way to log in
 * as Admin, so we let everyone through in `import.meta.env.DEV`. Flip
 * `ADMIN_DEV_OPEN` to `false` (or remove this whole guard once real auth
 * is in) before shipping to production.
 */
const ADMIN_DEV_OPEN = import.meta.env.DEV;

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (ADMIN_DEV_OPEN) return <>{children}</>;

  if (!isAuthenticated || user?.role !== 'Admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
