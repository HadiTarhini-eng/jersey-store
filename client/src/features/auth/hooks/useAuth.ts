import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { loginUser, registerUser, logoutUser, clearAuthError } from '../authSlice';
import { rehydrateCart } from '../../cart/cartSlice';
import { getStoredCart } from '../../../utils/storage';
import { ROUTES } from '../../../config/routes';
import type { LoginCredentials, RegisterCredentials } from '../../../types';

/** Encapsulates all auth actions and state — use in place of raw dispatch calls. */
export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, loading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginUser(credentials));
      if (loginUser.fulfilled.match(result)) {
        // Reload the per-user cart after login
        const userId = result.payload.user.id;
        dispatch(rehydrateCart(getStoredCart(userId)));
        navigate(ROUTES.HOME);
      }
    },
    [dispatch, navigate],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await dispatch(registerUser(credentials));
      if (registerUser.fulfilled.match(result)) {
        navigate(ROUTES.HOME);
      }
    },
    [dispatch, navigate],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    // Rehydrate as guest cart
    dispatch(rehydrateCart(getStoredCart(null)));
    navigate(ROUTES.HOME);
  }, [dispatch, navigate]);

  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);

  return { user, loading, error, isAuthenticated, login, register, logout, clearError };
}
