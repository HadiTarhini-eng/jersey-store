import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { authService } from '../services/authService';
import { validate, validators } from '../utils/validators';
import { ROUTES } from '../config/routes';

/**
 * Sets a new password for the recovery session opened by a reset link.
 *
 * Only reachable via /auth/callback after a recovery link (router state), so an
 * open signed-in session can't be used to skip the current-password check that
 * the profile page's change-password form enforces.
 */
export function ResetPasswordPage() {
  const { hasSession, initializing } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fromRecoveryLink = (location.state as { recovery?: boolean } | null)?.recovery === true;

  if (initializing) return <PageSpinner />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors = {
      password:        validate(form.password,        [validators.required, validators.password]),
      confirmPassword: validate(form.confirmPassword, [validators.required, validators.matchPassword(form.password)]),
    };
    if (Object.values(newErrors).some(Boolean)) { setErrors(newErrors); return; }

    setBusy(true);
    setError(null);
    try {
      await authService.completePasswordReset(form.password);
      toast.push({ variant: 'success', message: 'Password updated. You are signed in.' });
      navigate(ROUTES.PROFILE, { replace: true });
    } catch (err) {
      setError(authService.errorMessage(err, 'Could not update your password.'));
    } finally {
      setBusy(false);
    }
  };

  const change = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-stroke p-8">
        <h2 className="text-xl font-semibold text-primary mb-2">Set a new password</h2>

        {!hasSession || !fromRecoveryLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              This page only works from a password-reset email link, and the link may have expired.
            </p>
            <Link to={ROUTES.FORGOT_PASSWORD} className="block text-sm text-accent hover:text-accent-light font-medium transition-colors">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
            )}
            <Input
              label="New password"
              type="password"
              value={form.password}
              onChange={change('password')}
              error={errors.password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={form.confirmPassword}
              onChange={change('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
            />
            <Button type="submit" loading={busy} fullWidth>Update password</Button>
          </form>
        )}
      </div>
    </div>
  );
}
