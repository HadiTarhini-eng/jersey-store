import { describe, it, expect, vi } from 'vitest';
import authReducer, {
  clearAuthError,
  setUser,
  loginUser,
  logoutUser,
} from './authSlice';
import type { AuthState, User } from '../../types';

// ── Mock storage utils so tests don't touch localStorage ─────────────────────

vi.mock('../../utils/storage', () => ({
  getAccessToken:   () => null,
  storeAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  getStoredCart:    () => [],
}));

vi.mock('../../services/authService', () => ({
  authService: {
    login:        vi.fn(),
    register:     vi.fn(),
    logout:       vi.fn(),
    getMe:        vi.fn(),
    errorMessage: (_: unknown, fallback: string) => fallback,
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const cleanInitialState: AuthState = {
  user:            null,
  token:           null,
  loading:         false,
  error:           null,
  isAuthenticated: false,
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id:        'user-001',
    email:     'test@example.com',
    firstName: 'John',
    lastName:  'Doe',
    role:      'User',
    isActive:  true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('authSlice initial state', () => {
  it('has user null and isAuthenticated false when no stored token', () => {
    const state = authReducer(cleanInitialState, { type: '@@INIT' });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('has loading false and error null', () => {
    const state = authReducer(cleanInitialState, { type: '@@INIT' });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('clearAuthError', () => {
  it('clears the error field', () => {
    const stateWithError: AuthState = { ...cleanInitialState, error: 'Login failed.' };
    const state = authReducer(stateWithError, clearAuthError());
    expect(state.error).toBeNull();
  });
});

describe('setUser', () => {
  it('sets the user in state', () => {
    const user = makeUser();
    const state = authReducer(cleanInitialState, setUser(user));
    expect(state.user).toEqual(user);
  });

  it('replaces an existing user', () => {
    const existingState: AuthState = { ...cleanInitialState, user: makeUser({ id: 'old-user' }) };
    const newUser = makeUser({ id: 'new-user', email: 'new@example.com' });
    const state = authReducer(existingState, setUser(newUser));
    expect(state.user?.id).toBe('new-user');
  });
});

describe('loginUser thunk', () => {
  it('sets loading true on pending', () => {
    const state = authReducer(cleanInitialState, loginUser.pending('', { email: '', password: '' }));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets user, token and isAuthenticated on fulfilled', () => {
    const user  = makeUser();
    const token = 'abc.def.ghi';
    const state = authReducer(
      cleanInitialState,
      loginUser.fulfilled({ user, token }, '', { email: '', password: '' }),
    );
    expect(state.loading).toBe(false);
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets error and stops loading on rejected', () => {
    const state = authReducer(
      { ...cleanInitialState, loading: true },
      loginUser.rejected(null, '', { email: '', password: '' }, 'Login failed.'),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Login failed.');
  });
});

describe('logoutUser thunk', () => {
  it('clears user, token, and sets isAuthenticated false on fulfilled', () => {
    const loggedInState: AuthState = {
      user:            makeUser(),
      token:           'abc.def.ghi',
      loading:         false,
      error:           null,
      isAuthenticated: true,
    };
    const state = authReducer(loggedInState, logoutUser.fulfilled(undefined, ''));
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
