import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { validate, validators } from '../utils/validators';
import { ROUTES } from '../config/routes';

/**
 * Requests a Supabase password-reset email. The response is the same whether
 * or not the address has an account, so the page can't be used to probe emails.
 */
export function ForgotPasswordPage() {
  const { name } = useSiteConfig();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const emailErr = validate(email, [validators.required, validators.email]);
    if (emailErr) { setFieldError(emailErr); return; }

    setBusy(true);
    setError(null);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(authService.errorMessage(err, 'Could not send the reset email.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-widest text-primary">{name}</h1>
        </div>

        <div className="bg-surface rounded-2xl border border-stroke p-8">
          <h2 className="text-xl font-semibold text-primary mb-2">Reset your password</h2>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted leading-relaxed">
                If an account exists for <span className="text-primary font-medium break-all">{email}</span>,
                we&apos;ve sent a link to set a new password. Open it in this browser.
              </p>
              <Link to={ROUTES.LOGIN} className="block text-sm text-accent hover:text-accent-light font-medium transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <p className="text-sm text-muted leading-relaxed">
                Enter your account email and we&apos;ll send you a reset link.
              </p>
              {error && (
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
              )}
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError(undefined); }}
                error={fieldError}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Button type="submit" loading={busy} fullWidth>Send reset link</Button>
              <Link to={ROUTES.LOGIN} className="block text-center text-sm text-accent hover:text-accent-light font-medium transition-colors">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
