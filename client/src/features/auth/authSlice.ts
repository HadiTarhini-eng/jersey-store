import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { storeAccessToken, clearAccessToken, getAccessToken } from '../../utils/storage';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../../types';

// ── Thunks ───────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      storeAccessToken(result.token);
      return result;
    } catch (err) {
      return rejectWithValue(authService.errorMessage(err, 'Login failed.'));
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const result = await authService.register(credentials);
      storeAccessToken(result.token);
      return result;
    } catch (err) {
      return rejectWithValue(authService.errorMessage(err, 'Registration failed.'));
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await authService.logout(); } catch { /* swallow — clear locally regardless */ }
  clearAccessToken();
});

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (err) {
      return rejectWithValue(authService.errorMessage(err, 'Session expired.'));
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:            null,
  token:           getAccessToken(),
  loading:         false,
  error:           null,
  isAuthenticated: !!getAccessToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => { state.error = null; },
    setUser:        (state, action: PayloadAction<User>) => { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload.user;
        state.token           = payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });

    builder
      .addCase(registerUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload.user;
        state.token           = payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload as string;
      });

    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
    });

    builder
      .addCase(fetchCurrentUser.pending,   (state) => { state.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.user            = payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected,  (state) => {
        state.loading         = false;
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
        clearAccessToken();
      });
  },
});

export const { clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
