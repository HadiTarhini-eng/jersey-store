import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
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
 */
export function ProtectedRoute({ children, redirectIfAuthenticated = false }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated && !redirectIfAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (isAuthenticated && redirectIfAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
