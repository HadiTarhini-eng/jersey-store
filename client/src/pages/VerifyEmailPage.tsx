import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { PageSpinner } from '../components/ui/Spinner';
import { ROUTES } from '../config/routes';

/** Supabase rate-limits confirmation emails; mirror that in the UI. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Landing page after signup (and after a login attempt on an unconfirmed
 * address). Explains that the account needs verifying and offers a resend.
 */
export function VerifyEmailPage() {
  const { name } = useSiteConfig();
  const toast = useToast();
  const {
    pendingEmail, isAuthenticated, initializing, loading, resendVerificationEmail,
  } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (initializing) return <PageSpinner />;

  // Already verified and signed in — nothing to do here.
  if (isAuthenticated) return <Navigate to={ROUTES.HOME} replace />;

  const handleResend = async () => {
    if (!pendingEmail || cooldown > 0) return;
    const ok = await resendVerificationEmail(pendingEmail);
    if (ok) {
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.push({ variant: 'success', message: 'Verification email sent. Check your inbox.' });
    } else {
      toast.push({ variant: 'error', message: 'Could not resend the email. Please try again shortly.' });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-widest text-primary">{name}</h1>
        </div>

        <div className="bg-surface rounded-2xl border border-stroke p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-primary mb-2">Check your email</h2>

          <p className="text-sm text-muted leading-relaxed">
            {pendingEmail ? (
              <>
                We&apos;ve sent a verification link to{' '}
                <span className="text-primary font-medium break-all">{pendingEmail}</span>.
              </>
            ) : (
              <>We&apos;ve sent you a verification link.</>
            )}
          </p>
          <p className="text-sm text-muted leading-relaxed mt-3">
            Click the link in that email to activate your account. You&apos;ll need to verify
            before you can sign in.
          </p>

          {sent && (
            <div className="mt-5 p-3 rounded-xl bg-ok/10 border border-ok/30 text-ok text-sm">
              Verification email sent.
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleResend}
              loading={loading}
              disabled={!pendingEmail || cooldown > 0}
              fullWidth
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
            </Button>

            {!pendingEmail && (
              <p className="text-xs text-muted">
                We don&apos;t know which address to resend to — sign in again to continue.
              </p>
            )}

            <Link
              to={ROUTES.LOGIN}
              className="block text-sm text-accent hover:text-accent-light font-medium transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Didn&apos;t get it? Check your spam folder before resending.
        </p>
      </div>
    </div>
  );
}
