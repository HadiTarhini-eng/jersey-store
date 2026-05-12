import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { storeTokens, clearStoredTokens, getStoredTokens } from '../../utils/storage';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../../types';

// ── Thunks ───────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      storeTokens(result.tokens);
      return result;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Login failed.');
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const result = await authService.register(credentials);
      storeTokens(result.tokens);
      return result;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Registration failed.');
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await authService.logout(); } catch { /* swallow — clear locally regardless */ }
  clearStoredTokens();
});

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Session expired.');
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:            null,
  tokens:          getStoredTokens(),
  loading:         false,
  error:           null,
  isAuthenticated: !!getStoredTokens()?.accessToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => { state.error = null; },
    setUser:        (state, action: PayloadAction<User>) => { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    // ── Login ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload.user;
        state.tokens          = payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });

    // ── Register ───────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload.user;
        state.tokens          = payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user            = null;
      state.tokens          = null;
      state.isAuthenticated = false;
    });

    // ── Fetch current user ─────────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => { state.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading         = false;
        state.user            = null;
        state.tokens          = null;
        state.isAuthenticated = false;
        clearStoredTokens();
      });
  },
});

export const { clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
