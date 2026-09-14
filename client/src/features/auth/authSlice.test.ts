import { describe, it, expect, vi } from 'vitest';
import authReducer, {
  clearAuthError,
  setUser,
  setPendingEmail,
  loginUser,
  registerUser,
  logoutUser,
  restoreSession,
} from './authSlice';
import type { AuthState, User } from '../../types';

// ── Mock storage utils so tests don't touch localStorage ─────────────────────

vi.mock('../../utils/storage', () => ({
  getStoredCart: () => [],
}));

vi.mock('../../services/authService', () => ({
  authService: {
    login:              vi.fn(),
    register:           vi.fn(),
    logout:             vi.fn(),
    getSession:         vi.fn(),
    syncProfile:        vi.fn(),
    resendVerification: vi.fn(),
    errorMessage:       (_: unknown, fallback: string) => fallback,
  },
  EmailNotVerifiedError: class extends Error {},
  isEmailVerified: () => true,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const cleanInitialState: AuthState = {
  user:            null,
  hasSession:      false,
  emailVerified:   false,
  pendingEmail:    null,
  initializing:    false,
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

const credentials = { email: '', password: '' };

// ── Initial state ─────────────────────────────────────────────────────────────

describe('authSlice initial state', () => {
  it('has user null and isAuthenticated false when there is no session', () => {
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

describe('setPendingEmail', () => {
  it('remembers the address awaiting verification', () => {
    const state = authReducer(cleanInitialState, setPendingEmail('new@example.com'));
    expect(state.pendingEmail).toBe('new@example.com');
  });
});

describe('loginUser thunk', () => {
  it('sets loading true on pending', () => {
    const state = authReducer(cleanInitialState, loginUser.pending('', credentials));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets user, verification and isAuthenticated on fulfilled', () => {
    const user  = makeUser();
    const state = authReducer(cleanInitialState, loginUser.fulfilled(user, '', credentials));
    expect(state.loading).toBe(false);
    expect(state.user).toEqual(user);
    expect(state.hasSession).toBe(true);
    expect(state.emailVerified).toBe(true);
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets error and stops loading on rejected', () => {
    const state = authReducer(
      { ...cleanInitialState, loading: true },
      loginUser.rejected(null, '', credentials, { message: 'Login failed.' }),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Login failed.');
    expect(state.isAuthenticated).toBe(false);
  });

  it('remembers the unverified address so the UI can offer a resend', () => {
    const state = authReducer(
      cleanInitialState,
      loginUser.rejected(null, '', credentials, {
        message: 'Please verify your email address before signing in.',
        unverifiedEmail: 'pending@example.com',
      }),
    );
    expect(state.pendingEmail).toBe('pending@example.com');
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('registerUser thunk', () => {
  it('never authenticates the user — it only records the pending address', () => {
    const state = authReducer(
      cleanInitialState,
      registerUser.fulfilled({ email: 'new@example.com' }, '', {
        firstName: 'A', lastName: 'B', email: 'new@example.com', phone: '1', password: 'x', confirmPassword: 'x',
      }),
    );
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.pendingEmail).toBe('new@example.com');
  });
});

describe('restoreSession thunk', () => {
  it('authenticates a verified session with a linked profile', () => {
    const user  = makeUser();
    const state = authReducer(
      { ...cleanInitialState, initializing: true },
      restoreSession.fulfilled(
        { hasSession: true, user, emailVerified: true, email: user.email },
        '',
        undefined,
      ),
    );
    expect(state.initializing).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('leaves an unverified session unauthenticated and records the address', () => {
    const state = authReducer(
      { ...cleanInitialState, initializing: true },
      restoreSession.fulfilled(
        { hasSession: true, user: null, emailVerified: false, email: 'pending@example.com' },
        '',
        undefined,
      ),
    );
    expect(state.hasSession).toBe(true);
    expect(state.emailVerified).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.pendingEmail).toBe('pending@example.com');
  });

  it('finishes initializing when there is no session at all', () => {
    const state = authReducer(
      { ...cleanInitialState, initializing: true },
      restoreSession.fulfilled(
        { hasSession: false, user: null, emailVerified: false, email: null },
        '',
        undefined,
      ),
    );
    expect(state.initializing).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('logoutUser thunk', () => {
  it('clears the session and sets isAuthenticated false on fulfilled', () => {
    const loggedInState: AuthState = {
      ...cleanInitialState,
      user:            makeUser(),
      hasSession:      true,
      emailVerified:   true,
      isAuthenticated: true,
    };
    const state = authReducer(loggedInState, logoutUser.fulfilled(undefined, ''));
    expect(state.user).toBeNull();
    expect(state.hasSession).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });
});
