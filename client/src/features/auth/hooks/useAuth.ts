import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  loginUser, registerUser, logoutUser, resendVerification,
  clearAuthError, setPendingEmail,
} from '../authSlice';
import { hydrateAuthenticatedCart, rehydrateCart } from '../../cart/cartSlice';
import { getStoredCart } from '../../../utils/storage';
import { ROUTES } from '../../../config/routes';
import type { LoginCredentials, RegisterCredentials } from '../../../types';

/** Encapsulates all auth actions and state — use in place of raw dispatch calls. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    user, loading, error, isAuthenticated, emailVerified, pendingEmail, initializing,
  } = useAppSelector((s) => s.auth);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginUser(credentials));
      if (loginUser.fulfilled.match(result)) {
        await dispatch(hydrateAuthenticatedCart(result.payload.id));
        navigate(ROUTES.HOME);
        return;
      }
      // Supabase refused the sign-in because the address isn't confirmed —
      // send them where they can finish verifying instead of dead-ending.
      const payload = result.payload as { unverifiedEmail?: string } | undefined;
      if (payload?.unverifiedEmail) navigate(ROUTES.VERIFY_EMAIL);
    },
    [dispatch, navigate],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await dispatch(registerUser(credentials));
      // Email confirmation is enabled, so signup never signs the user in.
      if (registerUser.fulfilled.match(result)) navigate(ROUTES.VERIFY_EMAIL);
    },
    [dispatch, navigate],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    // Rehydrate as guest cart
    dispatch(rehydrateCart(getStoredCart(null)));
    navigate(ROUTES.HOME);
  }, [dispatch, navigate]);

  /** Re-sends the signup confirmation email. Returns true on success. */
  const resendVerificationEmail = useCallback(
    async (email: string) => {
      const result = await dispatch(resendVerification(email));
      return resendVerification.fulfilled.match(result);
    },
    [dispatch],
  );

  const rememberPendingEmail = useCallback(
    (email: string | null) => dispatch(setPendingEmail(email)),
    [dispatch],
  );

  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);

  return {
    user, loading, error, isAuthenticated, emailVerified, pendingEmail, initializing,
    login, register, logout, resendVerificationEmail, rememberPendingEmail, clearError,
  };
}
