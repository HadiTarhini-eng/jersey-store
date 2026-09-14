/**
 * Thin domain wrapper around Supabase Auth + the API hub.
 *
 * Supabase Auth owns credentials, email verification and sessions. The backend
 * owns the application profile (`users` row) and is reached with the Supabase
 * access token; `POST /auth/sync` links the verified Supabase identity to that
 * profile and returns it.
 */
import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { authApi, extractErrorMessage } from './api';
import { supabase, authCallbackUrl } from './supabase';
import type { LoginCredentials, RegisterCredentials, User } from '../types';

/** Raised when Supabase refuses a sign-in because the address isn't confirmed. */
export class EmailNotVerifiedError extends Error {
  constructor(public readonly email: string) {
    super('Please verify your email address before signing in.');
    this.name = 'EmailNotVerifiedError';
  }
}

/** Supabase reports an unconfirmed address with this error code. */
const isUnverified = (error: AuthError | null): boolean =>
  error?.code === 'email_not_confirmed' ||
  /email not confirmed/i.test(error?.message ?? '');

/** True only when Supabase itself says the address is confirmed. */
export const isEmailVerified = (user: SupabaseUser | null | undefined): boolean =>
  Boolean(user?.email_confirmed_at);

/** Map Supabase auth errors onto messages that are safe to show a user. */
function authMessage(error: AuthError, fallback: string): string {
  switch (error.code) {
    case 'invalid_credentials':   return 'Incorrect email or password.';
    case 'user_already_exists':
    case 'email_exists':          return 'An account with this email already exists.';
    case 'weak_password':         return 'Please choose a stronger password (at least 8 characters).';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Too many attempts. Please wait a minute and try again.';
    case 'same_password':         return 'Your new password must be different from the current one.';
    default:                      return error.message || fallback;
  }
}

export const authService = {
  /**
   * Creates the Supabase account and triggers the verification email.
   * With "Confirm email" enabled Supabase returns no session here, so the
   * caller must send the user to the verify-email page rather than treating
   * them as signed in.
   */
  register: async (credentials: RegisterCredentials): Promise<{ needsVerification: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email:    credentials.email.trim().toLowerCase(),
      password: credentials.password,
      options: {
        emailRedirectTo: authCallbackUrl(),
        // Carried into the access token so the profile can be created with the
        // customer's real name on first sync. Never trusted for authorization.
        data: {
          first_name: credentials.firstName,
          last_name:  credentials.lastName,
          phone:      credentials.phone,
        },
      },
    });
    if (error) throw new Error(authMessage(error, 'Registration failed.'));

    return { needsVerification: !data.session || !isEmailVerified(data.user) };
  },

  /**
   * Signs in through Supabase, then resolves the application profile.
   * Throws EmailNotVerifiedError when the address hasn't been confirmed — the
   * UI routes that case to the verification page.
   */
  login: async (credentials: LoginCredentials): Promise<{ session: Session; user: User }> => {
    const email = credentials.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });

    if (error) {
      if (isUnverified(error)) throw new EmailNotVerifiedError(email);
      throw new Error(authMessage(error, 'Login failed.'));
    }
    if (!data.session) throw new Error('Login failed.');
    if (!isEmailVerified(data.user)) {
      // Defence in depth: if the project ever issues a session to an
      // unconfirmed address, don't let it through.
      await supabase.auth.signOut();
      throw new EmailNotVerifiedError(email);
    }

    return { session: data.session, user: await authService.syncProfile(data.session) };
  },

  /** Clears the Supabase session. Local state cleanup happens in the slice. */
  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error && error.status !== 403) throw new Error(authMessage(error, 'Logout failed.'));
  },

  /** Current session (refreshed automatically by the client), or null. */
  getSession: async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  },

  /**
   * Links the signed-in Supabase identity to its application profile and
   * returns it. Safe to call repeatedly — the backend is idempotent.
   */
  syncProfile: async (session: Session): Promise<User> => {
    const meta = (session.user.user_metadata ?? {}) as Record<string, string | undefined>;
    return authApi.sync({
      firstName: meta.first_name,
      lastName:  meta.last_name,
      phone:     meta.phone ?? null,
    });
  },

  /** Re-sends the signup confirmation email. */
  resendVerification: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resend({
      type:  'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: authCallbackUrl() },
    });
    if (error) throw new Error(authMessage(error, 'Could not resend the verification email.'));
  },

  /**
   * Sends a password-reset link. It lands on /auth/callback, which recognises
   * the recovery session and forwards to the set-new-password page.
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: authCallbackUrl(),
    });
    if (error) throw new Error(authMessage(error, 'Could not send the reset email.'));
  },

  /**
   * Sets a new password for the recovery session opened by a reset link, then
   * revokes every other session so a stolen one can't outlive the reset.
   */
  completePasswordReset: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(authMessage(error, 'Could not update your password.'));
    await supabase.auth.signOut({ scope: 'others' });
  },

  /**
   * Changes the password of the currently signed-in user.
   *
   * Supabase's updateUser doesn't ask for the existing password, so we re-verify
   * it first — that keeps the "prove you know the current password" guarantee the
   * old endpoint enforced, and stops a walk-up attacker on an open session.
   */
  changePassword: async (email: string, currentPassword: string, newPassword: string): Promise<void> => {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: currentPassword,
    });
    if (reauthError) throw new Error('Current password is incorrect.');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(authMessage(error, 'Could not update your password.'));
    await supabase.auth.signOut({ scope: 'others' });
  },

  /** Bubble up backend message; falls back to a friendly default. */
  errorMessage: (err: unknown, fallback = 'Request failed.'): string =>
    err instanceof Error && err.name !== 'AxiosError'
      ? err.message
      : extractErrorMessage(err, fallback),
};
