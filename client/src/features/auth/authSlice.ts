import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Session } from '@supabase/supabase-js';
import { authService, EmailNotVerifiedError, isEmailVerified } from '../../services/authService';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../../types';

// ── Thunks ───────────────────────────────────────────────────────────────────
// Supabase Auth holds the session (and persists it across refreshes). The slice
// mirrors just enough of it for the UI: the application profile, whether the
// address is verified, and the pending email awaiting verification.

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const { user } = await authService.login(credentials);
      return user;
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        return rejectWithValue({ message: err.message, unverifiedEmail: err.email });
      }
      return rejectWithValue({ message: authService.errorMessage(err, 'Login failed.') });
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      await authService.register(credentials);
      return { email: credentials.email.trim().toLowerCase() };
    } catch (err) {
      return rejectWithValue({ message: authService.errorMessage(err, 'Registration failed.') });
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await authService.logout(); } catch { /* swallow — clear locally regardless */ }
});

/**
 * Restores state from whatever Supabase session exists (page load, or an
 * auth-state change such as a completed verification). Resolves to null when
 * there is no session or the address is still unverified — the caller decides
 * where to send the user.
 */
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (session: Session | null | undefined, { rejectWithValue }) => {
    try {
      const current = session === undefined ? await authService.getSession() : session;
      if (!current) return { hasSession: false, user: null, emailVerified: false, email: null };
      if (!isEmailVerified(current.user)) {
        return { hasSession: true, user: null, emailVerified: false, email: current.user.email ?? null };
      }
      return {
        hasSession:    true,
        user:          await authService.syncProfile(current),
        emailVerified: true,
        email:         current.user.email ?? null,
      };
    } catch (err) {
      return rejectWithValue({ message: authService.errorMessage(err, 'Session could not be restored.') });
    }
  },
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      await authService.resendVerification(email);
      return true;
    } catch (err) {
      return rejectWithValue({ message: authService.errorMessage(err, 'Could not resend the verification email.') });
    }
  },
);

/** Payload shape shared by every rejected auth thunk. */
type AuthRejection = { message: string; unverifiedEmail?: string };

const messageOf = (payload: unknown): string =>
  (payload as AuthRejection | undefined)?.message ?? 'Something went wrong.';

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:            null,
  hasSession:      false,
  emailVerified:   false,
  pendingEmail:    null,
  initializing:    true,
  loading:         false,
  error:           null,
  isAuthenticated: false,
};

/** Signed out: no profile, no verification, nothing pending. */
const clearSession = (state: AuthState) => {
  state.user            = null;
  state.hasSession      = false;
  state.emailVerified   = false;
  state.isAuthenticated = false;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => { state.error = null; },
    setUser:        (state, action: PayloadAction<User>) => { state.user = action.payload; },
    /** Remembers which address is awaiting verification (shown on /verify-email). */
    setPendingEmail: (state, action: PayloadAction<string | null>) => {
      state.pendingEmail = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload;
        state.hasSession      = true;
        state.emailVerified   = true;
        state.isAuthenticated = true;
        state.pendingEmail    = null;
      })
      .addCase(loginUser.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = messageOf(payload);
        const unverified = (payload as AuthRejection | undefined)?.unverifiedEmail;
        if (unverified) state.pendingEmail = unverified;
        clearSession(state);
      });

    builder
      .addCase(registerUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        // Email confirmation is enabled: signup never authenticates the user.
        state.loading      = false;
        state.pendingEmail = payload.email;
        clearSession(state);
      })
      .addCase(registerUser.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = messageOf(payload);
      });

    builder.addCase(logoutUser.fulfilled, (state) => {
      clearSession(state);
      state.pendingEmail = null;
      state.error        = null;
    });

    builder
      .addCase(restoreSession.pending,   (state) => { state.loading = true; })
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.initializing    = false;
        state.user            = payload.user;
        state.hasSession      = payload.hasSession;
        state.emailVerified   = payload.emailVerified;
        state.isAuthenticated = payload.emailVerified && !!payload.user;
        if (!payload.emailVerified && payload.email) state.pendingEmail = payload.email;
      })
      .addCase(restoreSession.rejected,  (state, { payload }) => {
        state.loading      = false;
        state.initializing = false;
        state.error        = messageOf(payload);
        clearSession(state);
      });

    builder
      .addCase(resendVerification.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(resendVerification.fulfilled, (state) => { state.loading = false; })
      .addCase(resendVerification.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = messageOf(payload);
      });
  },
});

export const { clearAuthError, setUser, setPendingEmail } = authSlice.actions;
export default authSlice.reducer;
