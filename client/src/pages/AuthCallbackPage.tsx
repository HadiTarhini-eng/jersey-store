import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { restoreSession } from '../features/auth/authSlice';
import { hydrateAuthenticatedCart } from '../features/cart/cartSlice';
import { isAuthPKCECodeVerifierMissingError, type EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { isEmailVerified } from '../services/authService';
import { Spinner } from '../components/ui/Spinner';
import { ROUTES } from '../config/routes';

interface Failure {
  title: string;
  message: string;
}

const INVALID_LINK: Failure = {
  title: 'Link invalid or expired',
  message: 'That link is invalid, has expired, or has already been used. Please request a new one.',
};

const OTHER_BROWSER: Failure = {
  title: 'Open the link in the same browser',
  message:
    'This link can only be completed in the browser where you signed up or requested it. ' +
    'If you were confirming your email, it may already be confirmed — try signing in. ' +
    'Otherwise, request a new link from this browser.',
};

/** Only the email-link types this app sends are accepted from a token_hash link. */
const OTP_TYPES: readonly EmailOtpType[] = ['signup', 'email', 'recovery', 'email_change'];

/**
 * Landing route for every Supabase email link (signup verification, password
 * reset).
 *
 * The client uses PKCE with `detectSessionInUrl: false`, so the default email
 * links arrive as `?code=…` and are exchanged here explicitly; the exchange only
 * succeeds in the browser holding the PKCE verifier. A `?token_hash=…&type=…`
 * link (only produced by a custom email template) is verified with Supabase and
 * works from any browser. Tokens in the URL fragment are never accepted — that
 * would let a crafted link sign the visitor into someone else's session.
 *
 * Success is decided by the session Supabase returns (`email_confirmed_at`),
 * never by URL parameters.
 */
export function AuthCallbackPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [failure, setFailure] = useState<Failure | null>(null);
  // StrictMode double-invokes effects; a code may only be redeemed once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async (): Promise<Failure | null> => {
      // Supabase reports link problems (expired, already used) as query or
      // fragment params depending on the flow.
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      if (params.get('error') || params.get('error_code') || fragment.get('error') || fragment.get('error_code')) {
        return INVALID_LINK;
      }

      const code      = params.get('code');
      const tokenHash = params.get('token_hash');
      const otpType   = params.get('type') as EmailOtpType | null;
      let recovery = false;

      if (code) {
        // supabase-js emits PASSWORD_RECOVERY (instead of SIGNED_IN) while
        // exchanging a code that came from a reset-password email.
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') recovery = true;
        });
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (isAuthPKCECodeVerifierMissingError(error)) return OTHER_BROWSER;
          if (error) return INVALID_LINK;
        } catch (err) {
          return isAuthPKCECodeVerifierMissingError(err) ? OTHER_BROWSER : INVALID_LINK;
        } finally {
          listener.subscription.unsubscribe();
        }
      } else if (tokenHash && otpType && OTP_TYPES.includes(otpType)) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
        if (error) return INVALID_LINK;
        recovery = otpType === 'recovery';
      } else {
        return INVALID_LINK;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session || !isEmailVerified(data.session.user)) return INVALID_LINK;

      // Session is good — link the profile and populate auth state before
      // handing control to a protected route.
      const result = await dispatch(restoreSession(data.session));
      if (restoreSession.rejected.match(result)) {
        return {
          title: 'Could not load your account',
          message: 'Your link worked, but we could not load your account. Please try signing in.',
        };
      }

      const userId = result.payload.user?.id;
      if (userId) await dispatch(hydrateAuthenticatedCart(userId));

      // `replace` drops the one-time code from browser history.
      if (recovery) navigate(ROUTES.RESET_PASSWORD, { replace: true, state: { recovery: true } });
      else navigate(ROUTES.HOME, { replace: true });
      return null;
    };

    void run().then((result) => { if (result) setFailure(result); });
  }, [dispatch, navigate, params]);

  if (!failure) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted">Completing sign-in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-stroke p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-danger/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-primary mb-2">{failure.title}</h2>
        <p className="text-sm text-muted leading-relaxed">{failure.message}</p>

        <div className="mt-6 space-y-3">
          <Link
            to={ROUTES.LOGIN}
            className="block w-full py-3 rounded-xl bg-accent text-accent-dark font-medium hover:bg-accent-light transition-colors"
          >
            Go to sign in
          </Link>
          <Link
            to={ROUTES.VERIFY_EMAIL}
            className="block text-sm text-accent hover:text-accent-light font-medium transition-colors"
          >
            Resend verification email
          </Link>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="block text-sm text-accent hover:text-accent-light font-medium transition-colors"
          >
            Request a new password-reset link
          </Link>
        </div>
      </div>
    </div>
  );
}
